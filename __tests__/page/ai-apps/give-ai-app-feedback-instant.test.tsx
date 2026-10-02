import '@testing-library/jest-dom';
import { createRef } from 'react';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import {
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

function renderDialog(capture: (() => Promise<AppCapture>) | undefined, isOpen = true) {
  return render(
    <GiveAiAppFeedbackDialog
      isOpen={isOpen}
      onClose={jest.fn()}
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
    expect(screen.getByText(/Automatic capture may not be exact/)).toBeInTheDocument();
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
  it('"Misaligned? Tell us" marks the automatic picture and the report says so', async () => {
    renderDialog(() => Promise.resolve(shot(SHOT_A)));
    await flush();

    const toggle = screen.getByRole('button', { name: 'Misaligned? Tell us' });
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-pressed', 'true');
    expect(toggle).toHaveTextContent('Misaligned · noted');
    expect(mockAnalytics.onFeedbackCaptureMisaligned).toHaveBeenCalledWith({ appUid: 'app-1' });

    fireEvent.change(screen.getByPlaceholderText(FEEDBACK_PLACEHOLDER), { target: { value: 'Off by a bit' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send feedback' }));

    await waitFor(() => expect(mockMutate).toHaveBeenCalled());
    const { appUid, text } = mockMutate.mock.calls[0][0];
    expect(appUid).toBe('app-1');
    expect(text).toContain('https://cdn.test/hosted.png');
    expect(text).toContain('Automatic screenshot flagged as misaligned.');
  });

  it('an unflagged report carries no misaligned line', async () => {
    renderDialog(() => Promise.resolve(shot(SHOT_A)));
    await flush();

    fireEvent.change(screen.getByPlaceholderText(FEEDBACK_PLACEHOLDER), { target: { value: 'Looks right' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send feedback' }));

    await waitFor(() => expect(mockMutate).toHaveBeenCalled());
    expect(mockMutate.mock.calls[0][0].text).not.toContain('misaligned');
  });

  it('tells the member when the app has feedback turned off (403)', async () => {
    mockMutate.mockImplementation((_payload, options) => options?.onError?.({ status: 403 }));
    renderDialog(undefined);

    fireEvent.change(screen.getByPlaceholderText(FEEDBACK_PLACEHOLDER), { target: { value: 'Hello' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send feedback' }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Feedback is turned off for this app.'));
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
