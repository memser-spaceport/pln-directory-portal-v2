import '@testing-library/jest-dom';
import { createRef } from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import {
  FEEDBACK_PLACEHOLDER,
  GiveAiAppFeedbackDialog,
} from '@/components/page/ai-apps/components/GiveAiAppFeedbackDialog';
import {
  ANNOTATION_ATTR,
  attachImageFile,
  cropImageToDataUrl,
  requestTabCapture,
} from '@/components/page/ai-apps/components/screenshot-feedback';
import type { AppCapture } from '@/components/page/ai-apps/components/element-pins';

/**
 * A screenshot dragged from the strip (the automatic one or a Pick a part one)
 * into the description box opens the annotator, as the Annotate button does,
 * and leaves no plain picture in the text (LAB-3045).
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

jest.mock('@/components/page/ai-apps/components/screenshot-feedback', () => {
  const actual = jest.requireActual('@/components/page/ai-apps/components/screenshot-feedback');
  return {
    ...actual,
    requestTabCapture: jest.fn(),
    grabVideoFrame: jest.fn(),
    stopCaptureStream: jest.fn(),
    cropImageToDataUrl: jest.fn(),
    attachImageFile: jest.fn(),
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
    LiveRegionOverlay: ({
      onSelect,
      onCancel,
      scrollApp,
    }: {
      onSelect: (r: unknown) => void;
      onCancel: () => void;
      scrollApp?: (x: number, y: number, dx: number, dy: number) => void;
    }) => (
      <div data-testid="live-region-overlay">
        {scrollApp && (
          <button type="button" onClick={() => scrollApp(1, 2, 0, 120)}>
            Wheel
          </button>
        )}
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
  (attachImageFile as jest.Mock).mockReset().mockResolvedValue(CUT);
});

afterEach(() => {
  jest.clearAllMocks();
});

/** A DataTransfer that keeps what a drag start sets, for the drop that follows. */
function transfer(entries: Record<string, string> = {}, files: File[] = []) {
  const store: Record<string, string> = { ...entries };
  return {
    files,
    get types() {
      return Object.keys(store);
    },
    effectAllowed: 'all',
    dropEffect: 'none',
    setData: (type: string, value: string) => {
      store[type] = value;
    },
    getData: (type: string) => store[type] ?? '',
  };
}

const box = () => screen.getByPlaceholderText(FEEDBACK_PLACEHOLDER);
const preview = (n: number) => screen.getByRole('button', { name: `Open screenshot ${n}` });

/** Drags the preview of screenshot `n` and drops it on the description box; true when the drop was not taken. */
function dragShotToBox(n: number) {
  const data = transfer();
  fireEvent.dragStart(preview(n), { dataTransfer: data });
  return fireEvent.drop(box(), { dataTransfer: data });
}

/** jsdom never loads images: Pick a part's crop waits for one, so it "loads" at once. */
function withLoadingImages() {
  const OriginalImage = window.Image;
  window.Image = class {
    onload: (() => void) | null = null;
    naturalWidth = 800;
    set src(_value: string) {
      setTimeout(() => this.onload?.());
    }
  } as unknown as typeof Image;
  return () => {
    window.Image = OriginalImage;
  };
}

describe('dropping a screenshot into the description box', () => {
  it('opens the annotator on the automatic screenshot, and its marks show on the preview and are sent', async () => {
    renderDialog(() => Promise.resolve(shot(SHOT_A)));
    await flush();

    expect(dragShotToBox(1)).toBe(false);
    fireEvent.click(screen.getByRole('button', { name: 'Save marks' }));

    await waitFor(() => expect(preview(1).querySelector('canvas')).not.toBeNull());
    expect(shotLabel('Screenshots · 1')).toBeInTheDocument();
    expect(box()).toHaveValue('');

    fireEvent.change(box(), { target: { value: 'Broken button' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send feedback' }));
    await waitFor(() => expect(mockMutate).toHaveBeenCalled());
    expect(mockMutate.mock.calls[0][0].text).toContain(ANNOTATION_ATTR);
  });

  it('opens the annotator on a Pick a part screenshot in the same way', async () => {
    const restore = withLoadingImages();
    try {
      const capture = jest.fn().mockResolvedValueOnce(shot(SHOT_A)).mockResolvedValueOnce(shot(SHOT_B));
      renderDialog(capture);
      await flush();
      fireEvent.click(screen.getByRole('button', { name: 'Pick a part' }));
      fireEvent.click(screen.getByRole('button', { name: 'Drag done' }));
      await waitFor(() => expect(screen.getByRole('img', { name: 'Screenshot 2' })).toHaveAttribute('src', CUT));

      expect(dragShotToBox(2)).toBe(false);
      fireEvent.click(screen.getByRole('button', { name: 'Save marks' }));

      await waitFor(() => expect(preview(2).querySelector('canvas')).not.toBeNull());
      expect(preview(1).querySelector('canvas')).toBeNull();
      expect(shotLabel('Screenshots · 2')).toBeInTheDocument();
    } finally {
      restore();
    }
  });

  it('leaves the text and the screenshot list as they were when the annotator is discarded', async () => {
    renderDialog(() => Promise.resolve(shot(SHOT_A)));
    await flush();
    fireEvent.change(box(), { target: { value: 'Before' } });

    expect(dragShotToBox(1)).toBe(false);
    fireEvent.click(screen.getByRole('button', { name: 'Discard marks' }));

    expect(screen.queryByRole('button', { name: 'Save marks' })).not.toBeInTheDocument();
    expect(box()).toHaveValue('Before');
    expect(shotLabel('Screenshots · 1')).toBeInTheDocument();
    expect(preview(1).querySelector('canvas')).toBeNull();
  });

  it('matches a picture the browser dragged on its own to its screenshot', async () => {
    renderDialog(() => Promise.resolve(shot(SHOT_A)));
    await flush();

    const notTaken = fireEvent.drop(box(), { dataTransfer: transfer({ 'text/html': `<img src="${SHOT_A}">` }) });
    expect(notTaken).toBe(false);
    fireEvent.click(screen.getByRole('button', { name: 'Save marks' }));

    await waitFor(() => expect(preview(1).querySelector('canvas')).not.toBeNull());
    expect(shotLabel('Screenshots · 1')).toBeInTheDocument();
  });

  it('opens a dropped image file in the annotator as a new screenshot, and adds nothing when discarded', async () => {
    renderDialog(() => Promise.resolve(shot(SHOT_A)));
    await flush();
    const file = new File(['x'], 'shot.png', { type: 'image/png' });

    expect(fireEvent.drop(box(), { dataTransfer: transfer({}, [file]) })).toBe(false);
    fireEvent.click(await screen.findByRole('button', { name: 'Discard marks' }));
    expect(shotLabel('Screenshots · 1')).toBeInTheDocument();

    fireEvent.drop(box(), { dataTransfer: transfer({}, [file]) });
    fireEvent.click(await screen.findByRole('button', { name: 'Save marks' }));

    expect(attachImageFile).toHaveBeenCalledWith(file);
    await waitFor(() => expect(screen.getByRole('img', { name: 'Screenshot 2' })).toHaveAttribute('src', CUT));
    expect(box()).toHaveValue('');
  });

  it('leaves a text drop to the editor', async () => {
    renderDialog(() => Promise.resolve(shot(SHOT_A)));
    await flush();

    expect(fireEvent.drop(box(), { dataTransfer: transfer({ 'text/plain': 'hello' }) })).toBe(true);
    expect(screen.queryByRole('button', { name: 'Save marks' })).not.toBeInTheDocument();
  });
});
