import '@testing-library/jest-dom';
import { act, render, screen, fireEvent, waitFor } from '@testing-library/react';
import {
  AI_APP_FEEDBACK_DRAFT_KEY,
  FEEDBACK_PLACEHOLDER,
  GiveAiAppFeedbackDialog,
  LABOS_AI_APPS_OPTION,
} from '@/components/page/ai-apps/components/GiveAiAppFeedbackDialog';
import { toast } from '@/components/core/ToastContainer';
import { clearFormDraft, readFormDraft, writeFormDraft } from '@/utils/formDraftStorage';
import {
  AttachImageError,
  CaptureError,
  attachImageFile,
  grabVideoFrame,
  requestTabCapture,
  stopCaptureStream,
} from '@/components/page/ai-apps/components/screenshot-feedback';

const mockUseAiApps = jest.fn();
const mockMutate = jest.fn();
const mockContactSupportMutate = jest.fn();
const mockUseCurrentUserStore = jest.fn();
const mockOnFeedbackSubmitted = jest.fn();
const mockOnFeedbackSubmitFailed = jest.fn();
const mockOnFeedbackScreenshotClicked = jest.fn();
const mockOnFeedbackScreenshotCaptureDenied = jest.fn();
const mockOnFeedbackScreenshotCaptureFailed = jest.fn();
const mockOnFeedbackScreenshotCaptureCancelled = jest.fn();
const mockOnFeedbackScreenshotRegionSelected = jest.fn();
const mockOnFeedbackScreenshotAdded = jest.fn();
const mockOnFeedbackScreenshotAnnotatorDiscarded = jest.fn();
const mockOnFeedbackScreenshotEditOpened = jest.fn();
const mockOnFeedbackScreenshotEditSaved = jest.fn();
const mockOnFeedbackScreenshotRemoved = jest.fn();
const mockOnFeedbackScreenshotToolSelected = jest.fn();
const mockOnFeedbackImageAttached = jest.fn();

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
  default: ({
    options,
    value,
    onChange,
    inputId,
    placeholder,
    menuPlacement,
  }: {
    options: Array<{ label: string; value: string }>;
    value: { label: string; value: string } | null;
    onChange: (value: { label: string; value: string } | null) => void;
    inputId?: string;
    placeholder?: string;
    menuPlacement?: string;
  }) => (
    <div data-menu-placement={menuPlacement}>
      <span data-testid="selected-app">{value?.label ?? placeholder}</span>
      {options.map((opt) => (
        <button key={opt.value} type="button" onClick={() => onChange(opt)}>
          {opt.label}
        </button>
      ))}
      <input id={inputId} aria-label="Which app is this about?" readOnly value={value?.label ?? ''} />
    </div>
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
  useContactSupport: () => ({ mutate: mockContactSupportMutate, isPending: false }),
}));

jest.mock('@/services/auth/store', () => ({
  useCurrentUserStore: () => mockUseCurrentUserStore(),
}));

jest.mock('@/analytics/ai-apps.analytics', () => ({
  useAiAppsAnalytics: () => ({
    onFeedbackSubmitted: mockOnFeedbackSubmitted,
    onFeedbackSubmitFailed: mockOnFeedbackSubmitFailed,
    onFeedbackScreenshotClicked: mockOnFeedbackScreenshotClicked,
    onFeedbackScreenshotCaptureDenied: mockOnFeedbackScreenshotCaptureDenied,
    onFeedbackScreenshotCaptureFailed: mockOnFeedbackScreenshotCaptureFailed,
    onFeedbackScreenshotCaptureCancelled: mockOnFeedbackScreenshotCaptureCancelled,
    onFeedbackScreenshotRegionSelected: mockOnFeedbackScreenshotRegionSelected,
    onFeedbackScreenshotAdded: mockOnFeedbackScreenshotAdded,
    onFeedbackScreenshotAnnotatorDiscarded: mockOnFeedbackScreenshotAnnotatorDiscarded,
    onFeedbackScreenshotEditOpened: mockOnFeedbackScreenshotEditOpened,
    onFeedbackScreenshotEditSaved: mockOnFeedbackScreenshotEditSaved,
    onFeedbackScreenshotRemoved: mockOnFeedbackScreenshotRemoved,
    onFeedbackScreenshotToolSelected: mockOnFeedbackScreenshotToolSelected,
    onFeedbackImageAttached: mockOnFeedbackImageAttached,
  }),
}));

jest.mock('@/components/core/ToastContainer', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

const PIXEL_PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

jest.mock('@/components/page/ai-apps/components/screenshot-feedback', () => {
  const actual = jest.requireActual('@/components/page/ai-apps/components/screenshot-feedback');
  return {
    ...actual,
    requestTabCapture: jest.fn(),
    grabVideoFrame: jest.fn(),
    stopCaptureStream: jest.fn(),
    /* Decodes through `new Image()` and a 2D canvas, neither of which jsdom
       implements. Its own guards are unit-tested in attach-image-file.test.ts;
       here the subject is the wiring around it. */
    attachImageFile: jest.fn(),
    RegionSelectOverlay: ({
      freezeSrc,
      onSelect,
      onCancel,
    }: {
      freezeSrc: string;
      onSelect: (url: string) => void;
      onCancel: () => void;
    }) => (
      <div>
        <button type="button" onClick={() => onSelect(freezeSrc)}>
          Select region
        </button>
        <button type="button" onClick={onCancel}>
          Cancel capture
        </button>
      </div>
    ),
  };
});

const mockSaveRegistrationImage = jest.fn();
jest.mock('@/services/registration.service', () => ({
  saveRegistrationImage: (file: File) => mockSaveRegistrationImage(file),
}));

/**
 * jsdom ships no `navigator.mediaDevices`, so without this the dialog correctly
 * decides the browser cannot screen-capture and renders the upload fallback —
 * which is a real behaviour, just not the one most of these tests are about.
 * Declaring a capable browser keeps every existing case on the capture path;
 * the fallback gets its own describe block below, where it is the subject.
 */
const asCapableBrowser = () => {
  Object.defineProperty(window, 'isSecureContext', { configurable: true, value: true });
  Object.defineProperty(navigator, 'mediaDevices', {
    configurable: true,
    value: { getDisplayMedia: jest.fn() },
  });
};

describe('GiveAiAppFeedbackDialog', () => {
  beforeEach(() => {
    asCapableBrowser();
    window.localStorage.clear();
    mockUseCurrentUserStore.mockReturnValue({
      currentUser: { uid: 'member-1', name: 'Ada Lovelace', email: 'ada@example.com' },
    });
    mockSaveRegistrationImage.mockResolvedValue({ image: { url: 'https://cdn.test/hosted.png' } });
    (requestTabCapture as jest.Mock).mockReset();
    (grabVideoFrame as jest.Mock).mockReset();
    (stopCaptureStream as jest.Mock).mockReset();
  });

  afterEach(() => {
    jest.clearAllMocks();
    clearFormDraft(AI_APP_FEEDBACK_DRAFT_KEY);
  });

  it('renders nothing when closed', () => {
    mockUseAiApps.mockReturnValue({ apps: [], isLoading: false, isError: false });

    render(<GiveAiAppFeedbackDialog isOpen={false} onClose={jest.fn()} appUid="app-1" appName="My App" />);

    expect(screen.queryByText('Give feedback')).not.toBeInTheDocument();
  });

  it('shows picker preselected on detail page and submits feedback for that app', async () => {
    mockUseAiApps.mockReturnValue({
      apps: [{ uid: 'app-1', name: 'My App' }],
      isLoading: false,
      isError: false,
    });
    const onClose = jest.fn();

    render(<GiveAiAppFeedbackDialog isOpen onClose={onClose} appUid="app-1" appName="My App" />);

    expect(screen.getByText(/Posting as/)).toBeInTheDocument();
    expect(screen.getByText('Ada Lovelace')).toBeInTheDocument();
    expect(screen.getByLabelText('Which app is this about?')).toBeInTheDocument();
    expect(screen.getByTestId('selected-app')).toHaveTextContent('My App');
    expect(screen.getByRole('button', { name: LABOS_AI_APPS_OPTION.label })).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText(FEEDBACK_PLACEHOLDER), {
      target: { value: 'Nice app!' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Send feedback' }));

    await waitFor(() =>
      expect(mockMutate).toHaveBeenCalledWith(
        { appUid: 'app-1', text: 'Nice app!' },
        expect.objectContaining({ onSuccess: expect.any(Function), onError: expect.any(Function) }),
      ),
    );
    expect(mockContactSupportMutate).not.toHaveBeenCalled();
  });

  it('submits HTML feedback', async () => {
    mockUseAiApps.mockReturnValue({
      apps: [{ uid: 'app-1', name: 'My App' }],
      isLoading: false,
      isError: false,
    });

    render(<GiveAiAppFeedbackDialog isOpen onClose={jest.fn()} appUid="app-1" appName="My App" />);

    fireEvent.change(screen.getByPlaceholderText(FEEDBACK_PLACEHOLDER), {
      target: { value: '<p><strong>Nice app!</strong></p>' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Send feedback' }));

    await waitFor(() =>
      expect(mockMutate).toHaveBeenCalledWith(
        { appUid: 'app-1', text: '<p><strong>Nice app!</strong></p>' },
        expect.objectContaining({ onSuccess: expect.any(Function) }),
      ),
    );
  });

  it('allows image-only feedback', async () => {
    mockUseAiApps.mockReturnValue({
      apps: [{ uid: 'app-1', name: 'My App' }],
      isLoading: false,
      isError: false,
    });

    render(<GiveAiAppFeedbackDialog isOpen onClose={jest.fn()} appUid="app-1" appName="My App" />);

    fireEvent.change(screen.getByPlaceholderText(FEEDBACK_PLACEHOLDER), {
      target: { value: '<p><img src="https://cdn.test/shot.png" alt="shot"></p>' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Send feedback' }));

    await waitFor(() =>
      expect(mockMutate).toHaveBeenCalledWith(
        { appUid: 'app-1', text: '<p><img src="https://cdn.test/shot.png" alt="shot"></p>' },
        expect.any(Object),
      ),
    );
  });

  it('does not submit empty Quill markup', async () => {
    mockUseAiApps.mockReturnValue({
      apps: [{ uid: 'app-1', name: 'My App' }],
      isLoading: false,
      isError: false,
    });

    render(<GiveAiAppFeedbackDialog isOpen onClose={jest.fn()} appUid="app-1" appName="My App" />);

    fireEvent.change(screen.getByPlaceholderText(FEEDBACK_PLACEHOLDER), {
      target: { value: '<p><br></p>' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Send feedback' }));

    expect(mockMutate).not.toHaveBeenCalled();
    expect(mockContactSupportMutate).not.toHaveBeenCalled();
  });

  it('shows LabOS option when there are no apps and does not show empty state', () => {
    mockUseAiApps.mockReturnValue({ apps: [], isLoading: false, isError: false });

    render(<GiveAiAppFeedbackDialog isOpen onClose={jest.fn()} />);

    expect(screen.queryByText('No apps available to give feedback on yet.')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: LABOS_AI_APPS_OPTION.label })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Send feedback' })).not.toBeDisabled();
  });

  it('LabOS selection sends contact-support request instead of app feedback', async () => {
    mockUseAiApps.mockReturnValue({ apps: [], isLoading: false, isError: false });
    const onClose = jest.fn();

    render(<GiveAiAppFeedbackDialog isOpen onClose={onClose} />);

    fireEvent.click(screen.getByRole('button', { name: LABOS_AI_APPS_OPTION.label }));
    fireEvent.change(screen.getByPlaceholderText(FEEDBACK_PLACEHOLDER), {
      target: { value: 'Platform needs better docs' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Send feedback' }));

    await waitFor(() =>
      expect(mockContactSupportMutate).toHaveBeenCalledWith(
        {
          topic: 'AI Apps Feedback',
          email: 'ada@example.com',
          name: 'Ada Lovelace',
          message: 'Platform needs better docs',
          metadata: {
            logged: true,
            uid: 'member-1',
            page: expect.any(String),
          },
        },
        expect.objectContaining({ onSuccess: expect.any(Function) }),
      ),
    );
    expect(mockMutate).not.toHaveBeenCalled();
    expect(mockOnFeedbackSubmitted).not.toHaveBeenCalled();
  });

  it('uploads pasted data-URI images before submitting', async () => {
    mockUseAiApps.mockReturnValue({
      apps: [{ uid: 'app-1', name: 'My App' }],
      isLoading: false,
      isError: false,
    });

    render(<GiveAiAppFeedbackDialog isOpen onClose={jest.fn()} appUid="app-1" appName="My App" />);

    fireEvent.change(screen.getByPlaceholderText(FEEDBACK_PLACEHOLDER), {
      target: {
        value: '<p><img src="data:image/png;base64,AAAA"></p>',
      },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Send feedback' }));

    await waitFor(() =>
      expect(mockMutate).toHaveBeenCalledWith(
        { appUid: 'app-1', text: '<p><img src="https://cdn.test/hosted.png"></p>' },
        expect.any(Object),
      ),
    );
    expect(mockSaveRegistrationImage).toHaveBeenCalledTimes(1);
  });

  it('does not submit when a pasted image fails to upload', async () => {
    mockSaveRegistrationImage.mockRejectedValue(new Error('upload failed'));
    mockUseAiApps.mockReturnValue({
      apps: [{ uid: 'app-1', name: 'My App' }],
      isLoading: false,
      isError: false,
    });

    render(<GiveAiAppFeedbackDialog isOpen onClose={jest.fn()} appUid="app-1" appName="My App" />);

    fireEvent.change(screen.getByPlaceholderText(FEEDBACK_PLACEHOLDER), {
      target: { value: '<p><img src="data:image/png;base64,AAAA"></p>' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Send feedback' }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Image upload failed. Please try again.'));
    expect(mockMutate).not.toHaveBeenCalled();
    expect(mockContactSupportMutate).not.toHaveBeenCalled();
  });

  it('restores a typed draft when the dialog is reopened', async () => {
    writeFormDraft(AI_APP_FEEDBACK_DRAFT_KEY, { message: 'Draft feedback text' });
    mockUseAiApps.mockReturnValue({
      apps: [{ uid: 'app-1', name: 'My App' }],
      isLoading: false,
      isError: false,
    });

    const { rerender } = render(
      <GiveAiAppFeedbackDialog isOpen={false} onClose={jest.fn()} appUid="app-1" appName="My App" />,
    );

    rerender(<GiveAiAppFeedbackDialog isOpen onClose={jest.fn()} appUid="app-1" appName="My App" />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText(FEEDBACK_PLACEHOLDER)).toHaveValue('Draft feedback text');
    });
  });

  it('persists typed feedback to localStorage while the dialog is open', async () => {
    jest.useFakeTimers();
    mockUseAiApps.mockReturnValue({
      apps: [{ uid: 'app-1', name: 'My App' }],
      isLoading: false,
      isError: false,
    });

    render(<GiveAiAppFeedbackDialog isOpen onClose={jest.fn()} appUid="app-1" appName="My App" />);

    // Flush useFormDraft's skipSaveRef unlock (setTimeout 0).
    await act(async () => {
      jest.advanceTimersByTime(0);
    });

    fireEvent.change(screen.getByPlaceholderText(FEEDBACK_PLACEHOLDER), {
      target: { value: 'Draft feedback text' },
    });

    await act(async () => {
      jest.advanceTimersByTime(500);
    });

    expect(readFormDraft<{ message: string }>(AI_APP_FEEDBACK_DRAFT_KEY)?.message).toBe('Draft feedback text');
    jest.useRealTimers();
  });

  it('clears the draft after a successful submit', async () => {
    writeFormDraft(AI_APP_FEEDBACK_DRAFT_KEY, { message: 'Should be cleared' });
    mockUseAiApps.mockReturnValue({
      apps: [{ uid: 'app-1', name: 'My App' }],
      isLoading: false,
      isError: false,
    });
    mockMutate.mockImplementation((_payload, options) => {
      options?.onSuccess?.();
    });

    render(<GiveAiAppFeedbackDialog isOpen onClose={jest.fn()} appUid="app-1" appName="My App" />);

    fireEvent.change(screen.getByPlaceholderText(FEEDBACK_PLACEHOLDER), {
      target: { value: 'Final feedback' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Send feedback' }));

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalled();
      expect(readFormDraft(AI_APP_FEEDBACK_DRAFT_KEY)).toBeNull();
    });
  });

  it('anchors the popover below the trigger', () => {
    mockUseAiApps.mockReturnValue({ apps: [], isLoading: false, isError: false });

    const anchor = document.createElement('button');
    document.body.appendChild(anchor);
    jest.spyOn(anchor, 'getBoundingClientRect').mockReturnValue({
      x: 800,
      y: 80,
      top: 80,
      bottom: 120,
      left: 800,
      right: 960,
      width: 160,
      height: 40,
      toJSON: () => ({}),
    });
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1000 });

    render(<GiveAiAppFeedbackDialog isOpen onClose={jest.fn()} anchorRef={{ current: anchor }} />);

    const overlay = document.body.querySelector('[style*="--feedback-popover-top"]');
    expect(overlay).toBeTruthy();
    expect(overlay?.getAttribute('style')).toContain('--feedback-popover-top: 128px');
    expect(overlay?.getAttribute('style')).toContain('--feedback-popover-right: 40px');

    anchor.remove();
  });

  it('raises the popover above the trigger when placement is "above"', () => {
    mockUseAiApps.mockReturnValue({ apps: [], isLoading: false, isError: false });

    const anchor = document.createElement('button');
    document.body.appendChild(anchor);
    jest.spyOn(anchor, 'getBoundingClientRect').mockReturnValue({
      x: 900,
      y: 700,
      top: 700,
      bottom: 748,
      left: 900,
      right: 960,
      width: 48,
      height: 48,
      toJSON: () => ({}),
    } as DOMRect);
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1000 });
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 800 });

    render(<GiveAiAppFeedbackDialog isOpen onClose={jest.fn()} anchorRef={{ current: anchor }} placement="above" />);

    const overlay = document.body.querySelector('[style*="--feedback-popover-bottom"]');
    expect(overlay).toBeTruthy();
    // 800 - 700 + 8 — measured up from the trigger's top edge, not down from
    // its bottom, which for a corner button would be below the fold.
    expect(overlay?.getAttribute('style')).toContain('--feedback-popover-bottom: 108px');
    expect(overlay?.getAttribute('style')).toContain('--feedback-popover-right: 40px');
    expect(overlay?.getAttribute('style')).not.toContain('--feedback-popover-top');
    expect(screen.getByTestId('selected-app').parentElement).toHaveAttribute('data-menu-placement', 'auto');

    anchor.remove();
  });

  it('does not reposition the overlay when a nested scroller fires scroll', () => {
    mockUseAiApps.mockReturnValue({ apps: [], isLoading: false, isError: false });

    const anchor = document.createElement('button');
    document.body.appendChild(anchor);
    const rect = {
      x: 900,
      y: 700,
      top: 700,
      bottom: 748,
      left: 900,
      right: 960,
      width: 48,
      height: 48,
      toJSON: () => ({}),
    } as DOMRect;
    const getRect = jest.spyOn(anchor, 'getBoundingClientRect').mockReturnValue(rect);
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1000 });
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 800 });

    render(<GiveAiAppFeedbackDialog isOpen onClose={jest.fn()} anchorRef={{ current: anchor }} placement="above" />);

    const overlay = document.body.querySelector('[style*="--feedback-popover-bottom"]');
    expect(overlay?.getAttribute('style')).toContain('--feedback-popover-bottom: 108px');

    getRect.mockReturnValue({ ...rect, top: 500, bottom: 548, y: 500 });

    const inner = document.createElement('div');
    document.body.appendChild(inner);
    inner.dispatchEvent(new Event('scroll', { bubbles: true }));

    // Capture-phase listening would have rewritten bottom to 308px (800-500+8)
    // and snapped the app picker menu back to the focused option.
    expect(overlay?.getAttribute('style')).toContain('--feedback-popover-bottom: 108px');

    inner.remove();
    anchor.remove();
  });

  it('shows a Take screenshot control', () => {
    mockUseAiApps.mockReturnValue({ apps: [], isLoading: false, isError: false });

    render(<GiveAiAppFeedbackDialog isOpen onClose={jest.fn()} />);

    expect(screen.getByRole('button', { name: 'Take screenshot' })).toBeInTheDocument();
    /* The hint names the browser picker, which is the moment people got lost —
       the old copy jumped straight to "drag to capture" and never mentioned
       that a permission dialog would appear first. */
    expect(screen.getByText(/ask which tab to share/)).toBeInTheDocument();
    expect(screen.getByText(/drag to capture any area of the page/)).toBeInTheDocument();
  });

  it('toasts when screenshot capture is unavailable', async () => {
    (requestTabCapture as jest.Mock).mockRejectedValue(
      new CaptureError('unsupported', 'Screenshots aren’t available in this browser.', 'NotSupportedError'),
    );
    mockUseAiApps.mockReturnValue({
      apps: [{ uid: 'app-1', name: 'My App' }],
      isLoading: false,
      isError: false,
    });

    render(<GiveAiAppFeedbackDialog isOpen onClose={jest.fn()} appUid="app-1" appName="My App" />);

    fireEvent.click(screen.getByRole('button', { name: 'Take screenshot' }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Screenshots aren’t available in this browser.'));
    expect(mockOnFeedbackScreenshotClicked).toHaveBeenCalled();
    expect(mockOnFeedbackScreenshotCaptureDenied).toHaveBeenCalledWith({
      reason: 'unsupported',
      errorName: 'NotSupportedError',
    });
  });

  /**
   * A capture used to be frozen the moment it was added: the strip showed a
   * thumbnail and a ✕, so a misplaced comment meant deleting the screenshot and
   * taking it again.
   */
  describe('reopening an added screenshot', () => {
    const takeAndAdd = async () => {
      (requestTabCapture as jest.Mock).mockResolvedValue({ getTracks: () => [{ stop: jest.fn() }] });
      (grabVideoFrame as jest.Mock).mockResolvedValue(PIXEL_PNG);
      (stopCaptureStream as jest.Mock).mockImplementation(() => undefined);
      mockUseAiApps.mockReturnValue({ apps: [{ uid: 'app-1', name: 'My App' }], isLoading: false, isError: false });

      render(<GiveAiAppFeedbackDialog isOpen onClose={jest.fn()} appUid="app-1" appName="My App" />);

      fireEvent.click(screen.getByRole('button', { name: 'Take screenshot' }));
      await waitFor(() => expect(screen.getByRole('button', { name: 'Select region' })).toBeInTheDocument());
      fireEvent.click(screen.getByRole('button', { name: 'Select region' }));
      await waitFor(() => expect(screen.getByRole('button', { name: 'Add to feedback' })).toBeInTheDocument());
      fireEvent.click(screen.getByRole('button', { name: 'Add to feedback' }));
      await waitFor(() => expect(screen.getByAltText('Screenshot 1')).toBeInTheDocument());
    };

    it('opens the annotator again from the thumbnail', async () => {
      await takeAndAdd();

      fireEvent.click(screen.getByRole('button', { name: 'Edit screenshot 1' }));

      /* Its footer says what this visit is: the CHANGES can be discarded, while
         the screenshot stays in the feedback either way — and it does not say
         "Cancel", which the dialog underneath already says about something
         else. */
      await waitFor(() => expect(screen.getByRole('button', { name: 'Save changes' })).toBeInTheDocument());
      expect(screen.getByRole('button', { name: 'Discard changes' })).toBeInTheDocument();
    });

    /* One screenshot in, one screenshot out. Appending would leave the version
       with the misplaced comment in the feedback beside the corrected one. */
    it('replaces the entry rather than adding a second', async () => {
      await takeAndAdd();

      fireEvent.click(screen.getByRole('button', { name: 'Edit screenshot 1' }));
      await waitFor(() => expect(screen.getByRole('button', { name: 'Save changes' })).toBeInTheDocument());
      fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));

      await waitFor(() => expect(screen.getByAltText('Screenshot 1')).toBeInTheDocument());
      expect(screen.queryByAltText('Screenshot 2')).not.toBeInTheDocument();
    });

    it('leaves the capture alone when the edit is cancelled', async () => {
      await takeAndAdd();

      fireEvent.click(screen.getByRole('button', { name: 'Edit screenshot 1' }));
      await waitFor(() => expect(screen.getByRole('button', { name: 'Discard changes' })).toBeInTheDocument());
      fireEvent.click(screen.getByRole('button', { name: 'Discard changes' }));

      await waitFor(() => expect(screen.queryByRole('button', { name: 'Save changes' })).not.toBeInTheDocument());
      expect(screen.getByAltText('Screenshot 1')).toBeInTheDocument();
    });

    /**
     * The edit has to be forgotten, not just closed.
     *
     * Leaving the edited id set means the NEXT capture is treated as an edit of
     * it — a fresh screenshot silently overwriting an older one, with the strip
     * showing the same count as before. Nothing on screen says anything went
     * wrong; the feedback just arrives missing a picture.
     */
    it('does not let a discarded edit swallow the next capture', async () => {
      await takeAndAdd();

      fireEvent.click(screen.getByRole('button', { name: 'Edit screenshot 1' }));
      await waitFor(() => expect(screen.getByRole('button', { name: 'Discard changes' })).toBeInTheDocument());
      fireEvent.click(screen.getByRole('button', { name: 'Discard changes' }));

      fireEvent.click(screen.getByRole('button', { name: 'Take screenshot' }));
      await waitFor(() => expect(screen.getByRole('button', { name: 'Select region' })).toBeInTheDocument());
      fireEvent.click(screen.getByRole('button', { name: 'Select region' }));
      await waitFor(() => expect(screen.getByRole('button', { name: 'Add to feedback' })).toBeInTheDocument());
      fireEvent.click(screen.getByRole('button', { name: 'Add to feedback' }));

      await waitFor(() => expect(screen.getByAltText('Screenshot 2')).toBeInTheDocument());
    });

    /* The ✕ sits inside the thumbnail's hit area. If the two are ever nested as
       buttons, the browser reparents them and this press opens the editor. */
    it('removes without opening the editor', async () => {
      await takeAndAdd();

      fireEvent.click(screen.getByRole('button', { name: 'Remove screenshot 1' }));

      await waitFor(() => expect(screen.queryByAltText('Screenshot 1')).not.toBeInTheDocument());
      expect(screen.queryByRole('button', { name: 'Save changes' })).not.toBeInTheDocument();
    });
  });

  /**
   * Deleting asks first, but only when the capture carries annotations.
   *
   * A plain screenshot is one drag away from being retaken; an annotated one is
   * minutes of work nothing on screen can bring back. Note that `takeAndAdd`
   * above produces an UNANNOTATED capture, which is why every older removal test
   * still takes the immediate path.
   */
  describe('deleting a screenshot', () => {
    beforeEach(() => {
      HTMLCanvasElement.prototype.setPointerCapture = jest.fn();
      HTMLCanvasElement.prototype.releasePointerCapture = jest.fn();
    });

    const takeAndAnnotate = async () => {
      (requestTabCapture as jest.Mock).mockResolvedValue({ getTracks: () => [{ stop: jest.fn() }] });
      (grabVideoFrame as jest.Mock).mockResolvedValue(PIXEL_PNG);
      (stopCaptureStream as jest.Mock).mockImplementation(() => undefined);
      mockUseAiApps.mockReturnValue({ apps: [{ uid: 'app-1', name: 'My App' }], isLoading: false, isError: false });

      render(<GiveAiAppFeedbackDialog isOpen onClose={jest.fn()} appUid="app-1" appName="My App" />);

      fireEvent.click(screen.getByRole('button', { name: 'Take screenshot' }));
      await waitFor(() => expect(screen.getByRole('button', { name: 'Select region' })).toBeInTheDocument());
      fireEvent.click(screen.getByRole('button', { name: 'Select region' }));
      await waitFor(() => expect(screen.getByRole('button', { name: 'Add to feedback' })).toBeInTheDocument());

      const canvas = document.querySelector('canvas')!;
      const bounds = {
        x: 0,
        y: 0,
        top: 0,
        left: 0,
        bottom: 200,
        right: 200,
        width: 200,
        height: 200,
        toJSON: () => ({}),
      };
      jest.spyOn(canvas, 'getBoundingClientRect').mockReturnValue(bounds);
      Object.defineProperty(canvas, 'width', { value: 200, configurable: true });
      Object.defineProperty(canvas, 'height', { value: 200, configurable: true });

      fireEvent.click(screen.getByRole('button', { name: 'Box' }));
      fireEvent(
        canvas,
        new MouseEvent('pointerdown', { bubbles: true, cancelable: true, button: 0, clientX: 20, clientY: 20 }),
      );
      fireEvent(
        canvas,
        new MouseEvent('pointermove', { bubbles: true, cancelable: true, button: 0, clientX: 120, clientY: 120 }),
      );
      fireEvent(
        canvas,
        new MouseEvent('pointerup', { bubbles: true, cancelable: true, button: 0, clientX: 120, clientY: 120 }),
      );

      fireEvent.click(screen.getByRole('button', { name: 'Add to feedback' }));
      await waitFor(() => expect(screen.getByAltText('Screenshot 1')).toBeInTheDocument());
    };

    it('asks before deleting an annotated capture', async () => {
      await takeAndAnnotate();

      fireEvent.click(screen.getByRole('button', { name: 'Remove screenshot 1' }));

      expect(screen.getByText('Delete screenshot?')).toBeInTheDocument();
      expect(screen.getByAltText('Screenshot 1')).toBeInTheDocument();
    });

    it('keeps the capture when the confirmation is declined', async () => {
      await takeAndAnnotate();

      fireEvent.click(screen.getByRole('button', { name: 'Remove screenshot 1' }));
      fireEvent.click(screen.getByRole('button', { name: 'Keep' }));

      expect(screen.queryByText('Delete screenshot?')).not.toBeInTheDocument();
      expect(screen.getByAltText('Screenshot 1')).toBeInTheDocument();
    });

    it('deletes once the confirmation is accepted', async () => {
      await takeAndAnnotate();

      fireEvent.click(screen.getByRole('button', { name: 'Remove screenshot 1' }));
      fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

      await waitFor(() => expect(screen.queryByAltText('Screenshot 1')).not.toBeInTheDocument());
      expect(mockOnFeedbackScreenshotRemoved).toHaveBeenCalled();
    });

    it('does not report a removal that was never confirmed', async () => {
      await takeAndAnnotate();

      fireEvent.click(screen.getByRole('button', { name: 'Remove screenshot 1' }));
      fireEvent.click(screen.getByRole('button', { name: 'Keep' }));

      expect(mockOnFeedbackScreenshotRemoved).not.toHaveBeenCalled();
    });

    /**
     * `Modal` registers its Escape handler on `document` in the CAPTURE phase and
     * calls `stopImmediatePropagation`, so a handler the confirmation registers
     * later could never intercept the key. Unguarded, Escape over the delete
     * confirmation closed the whole feedback panel and took the typed draft
     * with it.
     */
    it('does not close the feedback dialog when Escape is pressed over the confirmation', async () => {
      await takeAndAnnotate();

      fireEvent.click(screen.getByRole('button', { name: 'Remove screenshot 1' }));
      fireEvent.keyDown(document, { key: 'Escape' });

      expect(screen.getByText('Give feedback')).toBeInTheDocument();
      expect(screen.getByAltText('Screenshot 1')).toBeInTheDocument();
    });

    /* And the guard has to lift again, or the panel is left unable to close by
       keyboard for the rest of its life. */
    it('lets Escape close the dialog again once the confirmation is gone', async () => {
      const onClose = jest.fn();
      (requestTabCapture as jest.Mock).mockResolvedValue({ getTracks: () => [{ stop: jest.fn() }] });
      (grabVideoFrame as jest.Mock).mockResolvedValue(PIXEL_PNG);
      (stopCaptureStream as jest.Mock).mockImplementation(() => undefined);
      mockUseAiApps.mockReturnValue({ apps: [{ uid: 'app-1', name: 'My App' }], isLoading: false, isError: false });

      render(<GiveAiAppFeedbackDialog isOpen onClose={onClose} appUid="app-1" appName="My App" />);

      fireEvent.click(screen.getByRole('button', { name: 'Take screenshot' }));
      await waitFor(() => expect(screen.getByRole('button', { name: 'Select region' })).toBeInTheDocument());
      fireEvent.click(screen.getByRole('button', { name: 'Select region' }));
      await waitFor(() => expect(screen.getByRole('button', { name: 'Add to feedback' })).toBeInTheDocument());
      fireEvent.click(screen.getByRole('button', { name: 'Add to feedback' }));
      await waitFor(() => expect(screen.getByAltText('Screenshot 1')).toBeInTheDocument());

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(onClose).toHaveBeenCalled();
    });
  });

  it('attaches an annotated screenshot and submits it with the feedback body', async () => {
    (requestTabCapture as jest.Mock).mockResolvedValue({ getTracks: () => [{ stop: jest.fn() }] });
    (grabVideoFrame as jest.Mock).mockResolvedValue(PIXEL_PNG);
    (stopCaptureStream as jest.Mock).mockImplementation(() => undefined);
    mockUseAiApps.mockReturnValue({
      apps: [{ uid: 'app-1', name: 'My App' }],
      isLoading: false,
      isError: false,
    });
    mockMutate.mockImplementation((_payload, options) => {
      options?.onSuccess?.();
    });

    render(<GiveAiAppFeedbackDialog isOpen onClose={jest.fn()} appUid="app-1" appName="My App" />);

    fireEvent.click(screen.getByRole('button', { name: 'Take screenshot' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Select region' })).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'Select region' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Add to feedback' })).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'Add to feedback' }));
    await waitFor(() => expect(screen.getByAltText('Screenshot 1')).toBeInTheDocument());

    expect(mockOnFeedbackScreenshotClicked).toHaveBeenCalled();
    expect(mockOnFeedbackScreenshotRegionSelected).toHaveBeenCalled();
    expect(mockOnFeedbackScreenshotAdded).toHaveBeenCalledWith({ hasAnnotations: false });

    fireEvent.click(screen.getByRole('button', { name: 'Send feedback' }));

    await waitFor(() => expect(mockMutate).toHaveBeenCalled());
    const payload = (mockMutate as jest.Mock).mock.calls[0][0] as { appUid: string; text: string };
    expect(payload.appUid).toBe('app-1');
    expect(payload.text).toContain('https://cdn.test/hosted.png');
    expect(payload.text).toContain('data-annotations=');
    expect(payload.text).toContain('ai-app-annotated-screenshot');
    expect(mockSaveRegistrationImage).toHaveBeenCalled();
    expect(mockOnFeedbackSubmitted).toHaveBeenCalledWith({
      appUid: 'app-1',
      appName: 'My App',
      screenshotCount: 1,
      hasAnnotations: false,
    });
  });

  describe('screenshot analytics', () => {
    const startCapture = async () => {
      (requestTabCapture as jest.Mock).mockResolvedValue({ getTracks: () => [{ stop: jest.fn() }] });
      (grabVideoFrame as jest.Mock).mockResolvedValue(PIXEL_PNG);
      (stopCaptureStream as jest.Mock).mockImplementation(() => undefined);
      mockUseAiApps.mockReturnValue({ apps: [{ uid: 'app-1', name: 'My App' }], isLoading: false, isError: false });

      render(<GiveAiAppFeedbackDialog isOpen onClose={jest.fn()} appUid="app-1" appName="My App" />);
      fireEvent.click(screen.getByRole('button', { name: 'Take screenshot' }));
      await waitFor(() => expect(screen.getByRole('button', { name: 'Select region' })).toBeInTheDocument());
    };

    it('tracks region cancel', async () => {
      await startCapture();
      fireEvent.click(screen.getByRole('button', { name: 'Cancel capture' }));
      expect(mockOnFeedbackScreenshotCaptureCancelled).toHaveBeenCalled();
    });

    it('tracks annotator discard on a fresh capture', async () => {
      await startCapture();
      fireEvent.click(screen.getByRole('button', { name: 'Select region' }));
      await waitFor(() => expect(screen.getByRole('button', { name: 'Discard' })).toBeInTheDocument());
      fireEvent.click(screen.getByRole('button', { name: 'Discard' }));
      expect(mockOnFeedbackScreenshotAnnotatorDiscarded).toHaveBeenCalledWith({ isEditing: false });
    });

    it('tracks edit opened, saved, discarded, and removed', async () => {
      await startCapture();
      fireEvent.click(screen.getByRole('button', { name: 'Select region' }));
      await waitFor(() => expect(screen.getByRole('button', { name: 'Add to feedback' })).toBeInTheDocument());
      fireEvent.click(screen.getByRole('button', { name: 'Add to feedback' }));
      await waitFor(() => expect(screen.getByAltText('Screenshot 1')).toBeInTheDocument());

      fireEvent.click(screen.getByRole('button', { name: 'Edit screenshot 1' }));
      expect(mockOnFeedbackScreenshotEditOpened).toHaveBeenCalled();
      await waitFor(() => expect(screen.getByRole('button', { name: 'Save changes' })).toBeInTheDocument());

      fireEvent.click(screen.getByRole('button', { name: 'Comment' }));
      expect(mockOnFeedbackScreenshotToolSelected).toHaveBeenCalledWith({ tool: 'comment' });

      fireEvent.click(screen.getByRole('button', { name: 'Discard changes' }));
      expect(mockOnFeedbackScreenshotAnnotatorDiscarded).toHaveBeenCalledWith({ isEditing: true });

      fireEvent.click(screen.getByRole('button', { name: 'Edit screenshot 1' }));
      await waitFor(() => expect(screen.getByRole('button', { name: 'Save changes' })).toBeInTheDocument());
      fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
      expect(mockOnFeedbackScreenshotEditSaved).toHaveBeenCalledWith({ hasAnnotations: false });

      fireEvent.click(screen.getByRole('button', { name: 'Remove screenshot 1' }));
      expect(mockOnFeedbackScreenshotRemoved).toHaveBeenCalled();
    });

    it('tracks capture failure when the frame grab fails', async () => {
      (requestTabCapture as jest.Mock).mockResolvedValue({ getTracks: () => [{ stop: jest.fn() }] });
      (grabVideoFrame as jest.Mock).mockRejectedValue(new Error('grab failed'));
      (stopCaptureStream as jest.Mock).mockImplementation(() => undefined);
      mockUseAiApps.mockReturnValue({ apps: [{ uid: 'app-1', name: 'My App' }], isLoading: false, isError: false });

      render(<GiveAiAppFeedbackDialog isOpen onClose={jest.fn()} appUid="app-1" appName="My App" />);
      fireEvent.click(screen.getByRole('button', { name: 'Take screenshot' }));

      await waitFor(() =>
        expect(toast.error).toHaveBeenCalledWith('Could not capture a screenshot. Please try again.'),
      );
      expect(mockOnFeedbackScreenshotCaptureFailed).toHaveBeenCalledWith({ stage: 'grab' });
    });
  });
});

/**
 * The way out for anyone the capture path cannot serve.
 *
 * A picked image is handed to the same `freezeSrc` a captured frame lands on,
 * so region select and the annotator run unchanged — a blocked user keeps the
 * pin-and-draw tools rather than getting a plain inline image.
 */
describe('GiveAiAppFeedbackDialog capture fallback', () => {
  const asIncapableBrowser = () => {
    Object.defineProperty(window, 'isSecureContext', { configurable: true, value: true });
    Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: {} });
  };

  const asCapable = () => {
    Object.defineProperty(window, 'isSecureContext', { configurable: true, value: true });
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getDisplayMedia: jest.fn() },
    });
  };

  beforeEach(() => {
    window.localStorage.clear();
    mockUseCurrentUserStore.mockReturnValue({
      currentUser: { uid: 'member-1', name: 'Ada Lovelace', email: 'ada@example.com' },
    });
    mockUseAiApps.mockReturnValue({ apps: [{ uid: 'app-1', name: 'My App' }], isLoading: false, isError: false });
    (requestTabCapture as jest.Mock).mockReset();
    (grabVideoFrame as jest.Mock).mockReset();
    (stopCaptureStream as jest.Mock).mockReset();
    (attachImageFile as jest.Mock).mockReset();
  });

  afterEach(() => {
    jest.clearAllMocks();
    clearFormDraft(AI_APP_FEEDBACK_DRAFT_KEY);
  });

  /* Detected at render, so a browser that cannot capture never shows a button
     that cannot work — the old code let you press it and then apologised. */
  it('offers Attach image instead of Take screenshot on an unsupported browser', () => {
    asIncapableBrowser();

    render(<GiveAiAppFeedbackDialog isOpen onClose={jest.fn()} appUid="app-1" appName="My App" />);

    expect(screen.getByRole('button', { name: 'Attach image' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Take screenshot' })).not.toBeInTheDocument();
    expect(screen.getByText(/Screenshots need a desktop browser/)).toBeInTheDocument();
  });

  it('keeps Take screenshot on a browser that can capture', () => {
    asCapable();

    render(<GiveAiAppFeedbackDialog isOpen onClose={jest.fn()} appUid="app-1" appName="My App" />);

    expect(screen.getByRole('button', { name: 'Take screenshot' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Attach image' })).not.toBeInTheDocument();
  });

  /**
   * A policy block will still be a policy block on the next press, so the row
   * stops offering a door that is shut. Cancelling and a lost activation are
   * transient and must NOT swap — see the two cases below.
   */
  it.each([
    ['blocked', 'Screen sharing is turned off in this browser'],
    ['unreadable', 'couldn’t read the screen'],
  ])('swaps to Attach image after a %s failure', async (reason, hint) => {
    asCapable();
    (requestTabCapture as jest.Mock).mockRejectedValue(
      new CaptureError(reason as 'blocked', 'nope', 'NotAllowedError'),
    );

    render(<GiveAiAppFeedbackDialog isOpen onClose={jest.fn()} appUid="app-1" appName="My App" />);
    fireEvent.click(screen.getByRole('button', { name: 'Take screenshot' }));

    await waitFor(() => expect(screen.getByRole('button', { name: 'Attach image' })).toBeInTheDocument());
    expect(screen.getByText(new RegExp(hint))).toBeInTheDocument();
  });

  it.each([
    ['cancelled', 'AbortError'],
    ['retry', 'InvalidStateError'],
  ])('leaves the button alone after a transient %s failure', async (reason, errorName) => {
    asCapable();
    (requestTabCapture as jest.Mock).mockRejectedValue(
      new CaptureError(reason as 'cancelled', reason === 'retry' ? 'Click Take screenshot again.' : '', errorName),
    );

    render(<GiveAiAppFeedbackDialog isOpen onClose={jest.fn()} appUid="app-1" appName="My App" />);
    fireEvent.click(screen.getByRole('button', { name: 'Take screenshot' }));

    await waitFor(() => expect(mockOnFeedbackScreenshotCaptureDenied).toHaveBeenCalled());
    expect(screen.getByRole('button', { name: 'Take screenshot' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Attach image' })).not.toBeInTheDocument();
  });

  /* Cancelling the picker is a decision, not an error. It used to raise a red
     toast and be counted as a denial. */
  it('says nothing when the user cancels the picker', async () => {
    asCapable();
    (requestTabCapture as jest.Mock).mockRejectedValue(new CaptureError('cancelled', '', 'AbortError'));

    render(<GiveAiAppFeedbackDialog isOpen onClose={jest.fn()} appUid="app-1" appName="My App" />);
    fireEvent.click(screen.getByRole('button', { name: 'Take screenshot' }));

    await waitFor(() =>
      expect(mockOnFeedbackScreenshotCaptureDenied).toHaveBeenCalledWith({
        reason: 'cancelled',
        errorName: 'AbortError',
      }),
    );
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('records the DOMException name so the cause is visible in analytics', async () => {
    asCapable();
    (requestTabCapture as jest.Mock).mockRejectedValue(new CaptureError('blocked', 'nope', 'NotAllowedError'));

    render(<GiveAiAppFeedbackDialog isOpen onClose={jest.fn()} appUid="app-1" appName="My App" />);
    fireEvent.click(screen.getByRole('button', { name: 'Take screenshot' }));

    await waitFor(() =>
      expect(mockOnFeedbackScreenshotCaptureDenied).toHaveBeenCalledWith({
        reason: 'blocked',
        errorName: 'NotAllowedError',
      }),
    );
  });

  /* The picked file enters the pipeline exactly where a captured frame does,
     which is what keeps the annotator available to a blocked user. */
  it('sends an attached image into the region-select flow', async () => {
    asIncapableBrowser();
    (attachImageFile as jest.Mock).mockResolvedValue(PIXEL_PNG);

    render(<GiveAiAppFeedbackDialog isOpen onClose={jest.fn()} appUid="app-1" appName="My App" />);

    const input = screen.getByLabelText('Attach image') as HTMLInputElement;
    const file = new File(['x'], 'shot.png', { type: 'image/png' });
    fireEvent.change(input, { target: { files: [file] } });

    /* The same overlay a captured frame opens — that reuse is the point. */
    await waitFor(() => expect(screen.getByRole('button', { name: 'Select region' })).toBeInTheDocument());
    expect(attachImageFile).toHaveBeenCalledWith(file);
    expect(mockOnFeedbackImageAttached).toHaveBeenCalledWith({ trigger: 'unsupported' });
  });

  it('toasts and stays put when the file cannot be read', async () => {
    asIncapableBrowser();
    (attachImageFile as jest.Mock).mockRejectedValue(new AttachImageError('Choose an image file.'));

    render(<GiveAiAppFeedbackDialog isOpen onClose={jest.fn()} appUid="app-1" appName="My App" />);

    const input = screen.getByLabelText('Attach image') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [new File(['x'], 'notes.txt', { type: 'text/plain' })] } });

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Choose an image file.'));
    expect(screen.queryByRole('button', { name: 'Select region' })).not.toBeInTheDocument();
  });
});
