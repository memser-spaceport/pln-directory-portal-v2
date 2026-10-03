import '@testing-library/jest-dom';
import { createRef } from 'react';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import {
  AI_APP_FEEDBACK_DRAFT_KEY,
  FEEDBACK_PLACEHOLDER,
  GiveAiAppFeedbackDialog,
} from '@/components/page/ai-apps/components/GiveAiAppFeedbackDialog';
import { MAX_SCREENSHOTS } from '@/components/page/ai-apps/components/GiveAiAppFeedbackDialog/GiveAiAppFeedbackDialog';
import { toast } from '@/components/core/ToastContainer';
import {
  cropImageToDataUrl,
  dragToFrameRect,
  frameRectToCapturePixels,
  requestTabCapture,
} from '@/components/page/ai-apps/components/screenshot-feedback';
import type { AppCapture } from '@/components/page/ai-apps/components/element-pins';

/**
 * The Feedback form with instant screenshots: the app's bridge takes the
 * picture, so opening attaches one and Whole page / Pick a part never ask for a
 * screen share. Apps without the capture script (no `capture` prop) keep the
 * screen share, covered by give-ai-app-feedback-dialog.test.tsx.
 */

const mockUseAiApps = jest.fn();
const mockMutate = jest.fn();
const mockAnalytics = new Proxy({} as Record<string, jest.Mock>, {
  get: (target, key: string) => (target[key] ??= jest.fn()),
});

jest.mock('@/components/form/FormEditor', () => ({
  FormEditor: ({ name, placeholder }: { name: string; placeholder: string }) => {
    const { useFormContext } = require('react-hook-form');
    const { setValue, watch } = useFormContext();
    return (
      <textarea
        aria-label="Your feedback"
        placeholder={placeholder}
        value={watch(name) ?? ''}
        onChange={(e) => setValue(name, e.target.value, { shouldDirty: true })}
      />
    );
  },
}));

jest.mock('react-select', () => ({
  __esModule: true,
  default: ({ value, placeholder }: { value: { label: string } | null; placeholder?: string }) => (
    <span data-testid="selected-app">{value?.label ?? placeholder}</span>
  ),
  components: {},
}));

jest.mock('react-use', () => ({
  useMedia: () => false,
  useToggle: () => [false, jest.fn()],
}));

jest.mock('@/services/ai-apps/hooks/useAiApps', () => ({
  useAiApps: () => mockUseAiApps(),
}));

jest.mock('@/services/ai-app-feedback/hooks/useSubmitAiAppFeedback', () => ({
  useSubmitAiAppFeedback: () => ({ mutate: mockMutate, isPending: false }),
}));

jest.mock('@/components/ContactSupport/hooks/useContactSupport', () => ({
  useContactSupport: () => ({ mutate: jest.fn(), isPending: false }),
}));

jest.mock('@/services/auth/store', () => ({
  useCurrentUserStore: () => ({
    currentUser: { uid: 'member-1', name: 'Ada Lovelace', email: 'ada@example.com' },
  }),
}));

jest.mock('@/analytics/ai-apps.analytics', () => ({
  useAiAppsAnalytics: () => mockAnalytics,
}));

jest.mock('@/components/core/ToastContainer', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

const SHOT_A = 'data:image/jpeg;base64,QUFB';
const SHOT_B = 'data:image/jpeg;base64,QkJC';
const CUT = 'data:image/png;base64,Q1VU';

/** The drag the mocked overlay reports, in the frame's CSS px. */
const DRAG = { x: 10, y: 20, width: 100, height: 50 };

jest.mock('@/components/page/ai-apps/components/screenshot-feedback', () => {
  const actual = jest.requireActual('@/components/page/ai-apps/components/screenshot-feedback');
  return {
    ...actual,
    requestTabCapture: jest.fn(),
    grabVideoFrame: jest.fn(),
    stopCaptureStream: jest.fn(),
    cropImageToDataUrl: jest.fn(),
    /* Drawing on a canvas is out of jsdom's reach: "Save marks" stands for an annotated save. */
    AnnotatorModal: ({ onAdd, onDiscard }: { onAdd: (a: unknown) => void; onDiscard: () => void }) => (
      <div>
        <button
          type="button"
          onClick={() =>
            onAdd({
              version: 1,
              strokes: [
                {
                  color: '#f00',
                  width: 3,
                  points: [
                    { x: 0.1, y: 0.1 },
                    { x: 0.4, y: 0.3 },
                  ],
                },
              ],
              shapes: [],
              comments: [{ id: 'c1', x: 0.5, y: 0.5, text: 'Here' }],
            })
          }
        >
          Save marks
        </button>
        <button type="button" onClick={onDiscard}>
          Discard marks
        </button>
      </div>
    ),
    LiveRegionOverlay: ({ onSelect, onCancel }: { onSelect: (r: unknown) => void; onCancel: () => void }) => (
      <div data-testid="live-region-overlay">
        <button type="button" onClick={() => onSelect({ x: 10, y: 20, width: 100, height: 50 })}>
          Drag done
        </button>
        <button type="button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    ),
  };
});

/* jsdom has no IndexedDB: the pictures half of a draft is kept in memory here. */
const mockPictures = new Map<string, unknown>();
jest.mock('@/components/page/ai-apps/components/GiveAiAppFeedbackDialog/feedbackDrafts', () => ({
  ...jest.requireActual('@/components/page/ai-apps/components/GiveAiAppFeedbackDialog/feedbackDrafts'),
  readFeedbackPictures: (key: string) => Promise.resolve(mockPictures.get(key) ?? null),
  writeFeedbackPictures: (key: string, pictures: { shots: unknown[]; images: unknown[] } | null) => {
    if (pictures && (pictures.shots.length || pictures.images.length)) mockPictures.set(key, pictures);
    else mockPictures.delete(key);
    return Promise.resolve();
  },
}));

jest.mock('@/services/registration.service', () => ({
  saveRegistrationImage: () => Promise.resolve({ image: { url: 'https://cdn.test/hosted.png' } }),
}));

/** A capture the test resolves or rejects when it wants. */
function deferred() {
  let resolve!: (value: AppCapture) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<AppCapture>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

const shot = (dataUrl: string, width = 800): AppCapture => ({ dataUrl, width, height: 600 });

const frameRef = createRef<HTMLIFrameElement>();

function renderDialog(capture: (() => Promise<AppCapture>) | undefined, isOpen = true, onClose = jest.fn()) {
  return render(
    <GiveAiAppFeedbackDialog
      isOpen={isOpen}
      onClose={onClose}
      appUid="app-1"
      appName="My App"
      capture={capture}
      frameRef={frameRef}
    />,
  );
}

/** The "Screenshots · N" label (the count is its own span). */
const shotLabel = (text: string) => screen.getByText((_, el) => el?.tagName === 'P' && el.textContent === text);

/** Settles the promise chain a resolved capture runs through. */
const flush = () => act(async () => {});

beforeEach(() => {
  window.localStorage.clear();
  mockPictures.clear();
  Object.defineProperty(window, 'isSecureContext', { configurable: true, value: true });
  Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: { getDisplayMedia: jest.fn() } });
  mockUseAiApps.mockReturnValue({ apps: [{ uid: 'app-1', name: 'My App' }], isLoading: false, isError: false });
  (requestTabCapture as jest.Mock).mockReset().mockReturnValue(new Promise(() => {}));
  (cropImageToDataUrl as jest.Mock).mockReset().mockReturnValue(CUT);
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('opening the form attaches the app', () => {
  it('shows a placeholder while capturing, then the picture with its caption', async () => {
    const pending = deferred();
    const capture = jest.fn(() => pending.promise);
    renderDialog(capture);

    expect(screen.getByRole('status', { name: 'Capturing the app' })).toBeInTheDocument();
    expect(shotLabel('Screenshots · 1')).toBeInTheDocument();

    await act(async () => pending.resolve(shot(SHOT_A)));

    expect(screen.queryByRole('status', { name: 'Capturing the app' })).not.toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Screenshot 1' })).toHaveAttribute('src', SHOT_A);
    expect(capture).toHaveBeenCalledTimes(1);
    expect(requestTabCapture).not.toHaveBeenCalled();
  });

  it('drops a picture that arrives after the placeholder was removed', async () => {
    const pending = deferred();
    renderDialog(() => pending.promise);

    fireEvent.click(screen.getByRole('button', { name: 'Remove screenshot' }));
    await act(async () => pending.resolve(shot(SHOT_A)));

    expect(screen.queryByRole('img', { name: 'Screenshot 1' })).not.toBeInTheDocument();
    expect(screen.queryByText(/Screenshots ·/)).not.toBeInTheDocument();
  });

  it("drops the first open's late picture after a close and reopen, and captures again", async () => {
    const first = deferred();
    const second = deferred();
    const capture = jest.fn().mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
    const { rerender } = renderDialog(capture);

    const reopen = (isOpen: boolean) =>
      rerender(
        <GiveAiAppFeedbackDialog
          isOpen={isOpen}
          onClose={jest.fn()}
          appUid="app-1"
          appName="My App"
          capture={capture}
          frameRef={frameRef}
        />,
      );
    reopen(false);
    reopen(true);
    await act(async () => first.resolve(shot(SHOT_A)));
    await act(async () => second.resolve(shot(SHOT_B)));

    expect(capture).toHaveBeenCalledTimes(2);
    expect(screen.getAllByRole('img', { name: /^Screenshot \d$/ })).toHaveLength(1);
    expect(screen.getByRole('img', { name: 'Screenshot 1' })).toHaveAttribute('src', SHOT_B);
  });

  it('sends without a picture still on its way, and drops it when it lands', async () => {
    const pending = deferred();
    renderDialog(() => pending.promise);

    fireEvent.change(screen.getByPlaceholderText(FEEDBACK_PLACEHOLDER), { target: { value: 'Broken button' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send feedback' }));
    await waitFor(() => expect(mockMutate).toHaveBeenCalled());
    await act(async () => pending.resolve(shot(SHOT_A)));

    expect(mockMutate.mock.calls[0][0].text).not.toContain('<img');
    expect(screen.queryByRole('img', { name: 'Screenshot 1' })).not.toBeInTheDocument();
  });

  it('says so when the automatic capture fails, without opening a screen share', async () => {
    renderDialog(() => Promise.reject(new Error('timeout')));
    await flush();

    expect(screen.getByText(/Couldn’t capture the app automatically/)).toBeInTheDocument();
    expect(requestTabCapture).not.toHaveBeenCalled();
    expect(mockAnalytics.onFeedbackAppCapture).toHaveBeenCalledWith(
      expect.objectContaining({ source: 'auto', outcome: 'failed', error: 'timeout' }),
    );
  });

  it('attaches nothing on an app without the bridge, and keeps the screen-share button', () => {
    renderDialog(undefined);

    expect(screen.queryByRole('status', { name: 'Capturing the app' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Whole page' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Pick a part' })).not.toBeInTheDocument();
  });
});

describe('adding screenshots', () => {
  it('Whole page appends a capture after the automatic one', async () => {
    const capture = jest.fn().mockResolvedValueOnce(shot(SHOT_A)).mockResolvedValueOnce(shot(SHOT_B));
    renderDialog(capture);
    await flush();

    fireEvent.click(screen.getByRole('button', { name: 'Whole page' }));
    await flush();

    expect(shotLabel('Screenshots · 2')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Screenshot 2' })).toHaveAttribute('src', SHOT_B);
    expect(screen.getByText('Whole page', { selector: 'figcaption' })).toBeInTheDocument();
    expect(requestTabCapture).not.toHaveBeenCalled();
  });

  it('shows the screenshot shortcut on Pick a part, not on Whole page', async () => {
    renderDialog(jest.fn().mockResolvedValue(shot(SHOT_A)));
    await flush();

    expect(screen.getByRole('button', { name: 'Pick a part' })).toHaveTextContent('Ctrl+Shift+S');
    expect(screen.getByRole('button', { name: 'Whole page' })).not.toHaveTextContent('Ctrl+Shift+S');
  });

  it('Pick a part cuts the dragged rectangle out of the capture, in its pixels', async () => {
    /* jsdom never loads images: this one "loads" at twice the viewport (a DPR 2 capture). */
    const OriginalImage = window.Image;
    window.Image = class {
      onload: (() => void) | null = null;
      naturalWidth = 1600;
      set src(_value: string) {
        setTimeout(() => this.onload?.());
      }
    } as unknown as typeof Image;
    try {
      const capture = jest.fn().mockResolvedValueOnce(shot(SHOT_A)).mockResolvedValueOnce(shot(SHOT_B, 800));
      renderDialog(capture);
      await flush();

      fireEvent.click(screen.getByRole('button', { name: 'Pick a part' }));
      fireEvent.click(screen.getByRole('button', { name: 'Drag done' }));

      await waitFor(() => expect(screen.getByRole('img', { name: 'Screenshot 2' })).toHaveAttribute('src', CUT));
      expect((cropImageToDataUrl as jest.Mock).mock.calls[0][1]).toEqual({
        x: DRAG.x * 2,
        y: DRAG.y * 2,
        width: DRAG.width * 2,
        height: DRAG.height * 2,
      });
      expect(screen.getByText('Part of the page')).toBeInTheDocument();
      expect(screen.queryByTestId('live-region-overlay')).not.toBeInTheDocument();
    } finally {
      window.Image = OriginalImage;
    }
  });

  it('Pick a part can be cancelled without taking a picture', async () => {
    const capture = jest.fn().mockResolvedValueOnce(shot(SHOT_A));
    renderDialog(capture);
    await flush();

    fireEvent.click(screen.getByRole('button', { name: 'Pick a part' }));
    fireEvent.click(within(screen.getByTestId('live-region-overlay')).getByRole('button', { name: 'Cancel' }));

    expect(screen.queryByTestId('live-region-overlay')).not.toBeInTheDocument();
    expect(capture).toHaveBeenCalledTimes(1);
    expect(mockAnalytics.onFeedbackPickPartCancelled).toHaveBeenCalled();
  });

  it('a failed capture is reported, and only the NEXT click falls back to screen sharing', async () => {
    const capture = jest.fn().mockResolvedValueOnce(shot(SHOT_A)).mockRejectedValueOnce(new Error('timeout'));
    renderDialog(capture);
    await flush();

    fireEvent.click(screen.getByRole('button', { name: 'Whole page' }));
    await flush();

    expect(toast.error).toHaveBeenCalledWith('Couldn’t capture the app. Try again — it will use screen sharing.');
    expect(requestTabCapture).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Whole page' }));
    await waitFor(() => expect(requestTabCapture).toHaveBeenCalledTimes(1));
    expect(capture).toHaveBeenCalledTimes(2);
  });

  it(`stops at ${MAX_SCREENSHOTS} screenshots`, async () => {
    const capture = jest.fn().mockResolvedValue(shot(SHOT_A));
    renderDialog(capture);
    await flush();

    for (let i = 1; i < MAX_SCREENSHOTS; i += 1) {
      fireEvent.click(screen.getByRole('button', { name: 'Whole page' }));
      await flush();
    }

    expect(shotLabel(`Screenshots · ${MAX_SCREENSHOTS}`)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Whole page' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Pick a part' })).toBeDisabled();
    expect(screen.getByText(`Up to ${MAX_SCREENSHOTS} screenshots.`)).toBeInTheDocument();
  });
});

describe('sending', () => {
  it('tells the member when the app has feedback turned off (403)', async () => {
    mockMutate.mockImplementation((_payload, options) => options?.onError?.({ status: 403 }));
    renderDialog(undefined);

    fireEvent.change(screen.getByPlaceholderText(FEEDBACK_PLACEHOLDER), { target: { value: 'Hello' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send feedback' }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Feedback is turned off for this app.'));
  });
});

describe('after sending', () => {
  const send = async (text: string) => {
    fireEvent.change(screen.getByPlaceholderText(FEEDBACK_PLACEHOLDER), { target: { value: text } });
    fireEvent.click(screen.getByRole('button', { name: 'Send feedback' }));
    await screen.findByText('Feedback sent');
  };

  beforeEach(() => {
    mockMutate.mockImplementation((_payload, options) => options?.onSuccess?.());
  });

  it('stays open on the sent screen, with Give more feedback focused', async () => {
    const onClose = jest.fn();
    renderDialog(undefined, true, onClose);
    await send('Broken button');

    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByText('Thanks for your feedback!')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Give more feedback/ })).toHaveFocus();
    expect(screen.queryByPlaceholderText(FEEDBACK_PLACEHOLDER)).not.toBeInTheDocument();
  });

  it('Give more feedback starts a fresh form with a new automatic screenshot', async () => {
    const capture = jest.fn(() => Promise.resolve(shot(SHOT_A)));
    renderDialog(capture);
    await flush();
    await send('Broken button');

    fireEvent.click(screen.getByRole('button', { name: /Give more feedback/ }));
    await flush();

    expect(screen.getByPlaceholderText(FEEDBACK_PLACEHOLDER)).toHaveValue('');
    expect(capture).toHaveBeenCalledTimes(2);
    expect(screen.getByRole('img', { name: 'Screenshot 1' })).toHaveAttribute('src', SHOT_A);
  });

  it('the send chord gives more feedback and never sends the report again', async () => {
    renderDialog(undefined);
    await send('Broken button');

    fireEvent.keyDown(document, { key: 'Enter', metaKey: true });

    expect(screen.getByPlaceholderText(FEEDBACK_PLACEHOLDER)).toHaveValue('');
    expect(mockMutate).toHaveBeenCalledTimes(1);
  });

  it('Close and Esc close the panel', async () => {
    const onClose = jest.fn();
    renderDialog(undefined, true, onClose);
    await send('Broken button');

    const close = screen
      .getAllByRole('button', { name: 'Close' })
      .find((button) => button.getAttribute('aria-keyshortcuts') === 'Escape');
    fireEvent.click(close!);
    fireEvent.keyDown(document, { key: 'Escape' });

    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('lists what was sent from the second report on, without links', async () => {
    renderDialog(undefined);
    await send('Broken button');
    expect(screen.queryByText(/Sent while this was open/)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Give more feedback/ }));
    await send('Slow search');

    expect(screen.getByText('Sent while this was open · 2')).toBeInTheDocument();
    expect(screen.getByText('Broken button')).toBeInTheDocument();
    expect(screen.getByText('Slow search')).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('a failed send stays on the form', async () => {
    mockMutate.mockImplementation((_payload, options) => options?.onError?.({ status: 500 }));
    renderDialog(undefined);

    fireEvent.change(screen.getByPlaceholderText(FEEDBACK_PLACEHOLDER), { target: { value: 'Broken button' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send feedback' }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Something went wrong. Please try again.'));
    expect(screen.queryByText('Feedback sent')).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText(FEEDBACK_PLACEHOLDER)).toHaveValue('Broken button');
  });
});

describe('Pick a part geometry', () => {
  const frame = { left: 100, top: 50, width: 800, height: 600 };

  it('turns a drag on the page into a rectangle inside the frame, whichever way it went', () => {
    expect(dragToFrameRect({ x: 300, y: 250 }, { x: 150, y: 100 }, frame)).toEqual({
      x: 50,
      y: 50,
      width: 150,
      height: 150,
    });
  });

  it('clamps a drag that runs off the frame to its edges', () => {
    expect(dragToFrameRect({ x: 0, y: 0 }, { x: 200, y: 150 }, frame)).toEqual({ x: 0, y: 0, width: 100, height: 100 });
    expect(dragToFrameRect({ x: 850, y: 600 }, { x: 2000, y: 2000 }, frame)).toEqual({
      x: 750,
      y: 550,
      width: 50,
      height: 50,
    });
  });

  it('ignores a click or a drag that missed the app', () => {
    expect(dragToFrameRect({ x: 300, y: 300 }, { x: 304, y: 340 }, frame)).toBeNull();
    expect(dragToFrameRect({ x: 0, y: 0 }, { x: 90, y: 40 }, frame)).toBeNull();
  });

  it.each([
    [1, 800],
    [2, 1600],
  ])('scales into the capture at DPR %d', (dpr, imageWidth) => {
    expect(frameRectToCapturePixels(DRAG, 800, imageWidth)).toEqual({
      x: DRAG.x * dpr,
      y: DRAG.y * dpr,
      width: DRAG.width * dpr,
      height: DRAG.height * dpr,
    });
  });
});

describe('annotated previews', () => {
  it('draws the marks on the preview once a screenshot is annotated', async () => {
    renderDialog(() => Promise.resolve(shot(SHOT_A)));
    await flush();
    const preview = () => screen.getByRole('button', { name: 'Open screenshot 1' });
    expect(preview().querySelector('canvas')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Annotate screenshot 1' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save marks' }));

    await waitFor(() => expect(preview().querySelector('canvas')).not.toBeNull());
    expect(within(preview()).getByRole('img', { name: 'Screenshot 1' })).toHaveAttribute('src', SHOT_A);
    /* The comment pin is a plain marker: no button inside the preview's own button. */
    expect(within(preview()).getByText('1')).toBeInTheDocument();
    expect(within(preview()).queryByRole('button')).not.toBeInTheDocument();
  });

  it('offers no "Use screen share instead" when the app can capture', async () => {
    renderDialog(() => Promise.resolve(shot(SHOT_A)));
    await flush();
    expect(screen.getByRole('button', { name: 'Whole page' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Use screen share instead' })).not.toBeInTheDocument();
  });
});

describe('drafts', () => {
  const DRAFT_KEY = `${AI_APP_FEEDBACK_DRAFT_KEY}:app-1`;
  const typeFeedback = (value: string) =>
    fireEvent.change(screen.getByPlaceholderText(FEEDBACK_PLACEHOLDER), { target: { value } });

  function renderAt(appPath: string, capture?: () => Promise<AppCapture>, onClose = jest.fn()) {
    const props = {
      onClose,
      appUid: 'app-1',
      appName: 'My App',
      capture,
      frameRef,
      getContext: () => ({ appPath }) as never,
    };
    const view = render(<GiveAiAppFeedbackDialog isOpen {...props} />);
    const reopen = (path = appPath) => {
      props.getContext = () => ({ appPath: path }) as never;
      view.rerender(<GiveAiAppFeedbackDialog isOpen={false} {...props} />);
      view.rerender(<GiveAiAppFeedbackDialog isOpen {...props} />);
    };
    return { ...view, reopen };
  }

  it('closing with words keeps them, without asking; reopening restores them and says since when', async () => {
    const onClose = jest.fn();
    const { reopen } = renderAt('/orders', undefined, onClose);
    typeFeedback('Half a thought');

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Discard this draft?')).not.toBeInTheDocument();
    reopen();
    await flush();
    expect(screen.getByPlaceholderText(FEEDBACK_PLACEHOLDER)).toHaveValue('Half a thought');
    expect(screen.getByText(/Your unsent draft for this screen, kept in this browser since/)).toBeInTheDocument();
  });

  it('Esc closes and keeps the draft', () => {
    const onClose = jest.fn();
    renderAt('/orders', undefined, onClose);
    typeFeedback('Half a thought');

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(window.localStorage.getItem(`${DRAFT_KEY}:/orders`)).toContain('Half a thought');
  });

  it('the automatic screenshot alone leaves nothing behind', async () => {
    const { reopen } = renderAt('/orders', () => Promise.resolve(shot(SHOT_A)));
    await flush();
    expect(screen.getByRole('img', { name: 'Screenshot 1' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(window.localStorage.length).toBe(0);
    expect(mockPictures.size).toBe(0);
    reopen();
    expect(screen.queryByText(/Your unsent draft/)).not.toBeInTheDocument();
  });

  it('marks on the automatic screenshot make a draft, and reopening brings the picture back with them', async () => {
    const capture = jest.fn(() => Promise.resolve(shot(SHOT_A)));
    const { reopen } = renderAt('/orders', capture);
    await flush();
    fireEvent.click(screen.getByRole('button', { name: 'Annotate screenshot 1' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save marks' }));

    reopen();
    await flush();

    expect(capture).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Open screenshot 1' }).querySelector('canvas')).not.toBeNull();
    expect(screen.getByRole('img', { name: 'Screenshot 1' })).toHaveAttribute('src', SHOT_A);
  });

  it('keeps an image pasted into the text, out of localStorage', async () => {
    const { reopen } = renderAt('/orders');
    typeFeedback(`<p>See</p><p><img src="${SHOT_B}"></p>`);
    expect(window.localStorage.getItem(`${DRAFT_KEY}:/orders`)).not.toContain('data:');

    reopen();
    await flush();

    expect(screen.getByPlaceholderText(FEEDBACK_PLACEHOLDER)).toHaveValue(`<p>See</p><p><img src="${SHOT_B}"></p>`);
  });

  it('is per screen: another screen of the app starts empty and lists this one under Drafts', async () => {
    const { reopen } = renderAt('/orders');
    typeFeedback('About orders');

    reopen('/settings');
    await flush();

    expect(screen.getByPlaceholderText(FEEDBACK_PLACEHOLDER)).toHaveValue('');
    fireEvent.click(screen.getByRole('button', { name: 'Drafts · 1' }));
    expect(screen.getByText('About orders')).toBeInTheDocument();
    expect(screen.getByText(/My App · \/orders/)).toBeInTheDocument();
  });

  it('opening a draft from Drafts keeps the one in the panel, and sending it says where it was started', async () => {
    const { reopen } = renderAt('/orders');
    typeFeedback('About orders');
    reopen('/settings');
    await flush();
    typeFeedback('About settings');

    fireEvent.click(screen.getByRole('button', { name: 'Drafts · 1' }));
    fireEvent.click(screen.getByText('About orders'));
    await flush();

    expect(screen.getByPlaceholderText(FEEDBACK_PLACEHOLDER)).toHaveValue('About orders');
    expect(screen.getByText(/Your unsent draft started on My App · \/orders/)).toBeInTheDocument();
    expect(window.localStorage.getItem(`${DRAFT_KEY}:/settings`)).toContain('About settings');
    expect(screen.getByRole('button', { name: 'Drafts · 1' })).toBeInTheDocument();

    mockMutate.mockImplementation((_payload, options) => options?.onSuccess?.());
    fireEvent.click(screen.getByRole('button', { name: 'Send feedback' }));
    await waitFor(() => expect(mockMutate).toHaveBeenCalled());

    expect(mockMutate.mock.calls[0][0].text).toContain('<p>Started on My App · /orders</p>');
    expect(window.localStorage.getItem(`${DRAFT_KEY}:/orders`)).toBeNull();
    expect(window.localStorage.getItem(`${DRAFT_KEY}:/settings`)).toContain('About settings');
    mockMutate.mockReset();
  });

  it('a failed send keeps the draft; a successful one removes it', async () => {
    renderAt('/orders');
    typeFeedback('Broken button');

    mockMutate.mockImplementationOnce((_payload, options) => options?.onError?.({ status: 500 }));
    fireEvent.click(screen.getByRole('button', { name: 'Send feedback' }));
    await waitFor(() => expect(mockMutate).toHaveBeenCalledTimes(1));
    expect(window.localStorage.getItem(`${DRAFT_KEY}:/orders`)).toContain('Broken button');

    mockMutate.mockImplementationOnce((_payload, options) => options?.onSuccess?.());
    fireEvent.click(screen.getByRole('button', { name: 'Send feedback' }));
    await waitFor(() => expect(mockMutate).toHaveBeenCalledTimes(2));
    expect(window.localStorage.getItem(`${DRAFT_KEY}:/orders`)).toBeNull();
  });

  it('Discard asks first; Keep keeps it, Discard deletes it and closes', () => {
    const onClose = jest.fn();
    renderAt('/orders', undefined, onClose);
    typeFeedback('Half a thought');

    fireEvent.click(screen.getByRole('button', { name: 'Discard' }));
    expect(screen.getByText('Discard this draft?')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Keep' }));
    expect(screen.getByPlaceholderText(FEEDBACK_PLACEHOLDER)).toHaveValue('Half a thought');
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Discard' }));
    fireEvent.click(
      within(screen.getByText('Discard this draft?').parentElement!.parentElement!).getByRole('button', {
        name: 'Discard',
      }),
    );

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(window.localStorage.getItem(`${DRAFT_KEY}:/orders`)).toBeNull();
  });

  it('works when the browser cannot store anything', async () => {
    const setItem = jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    const onClose = jest.fn();
    const { reopen } = renderAt('/orders', undefined, onClose);
    typeFeedback('Broken button');
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    reopen();
    await flush();

    expect(screen.getByPlaceholderText(FEEDBACK_PLACEHOLDER)).toHaveValue('');
    typeFeedback('Broken button');
    fireEvent.click(screen.getByRole('button', { name: 'Send feedback' }));
    await waitFor(() => expect(mockMutate).toHaveBeenCalled());
    setItem.mockRestore();
  });
});
