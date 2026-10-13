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
const mockOnFeedbackTooLarge = jest.fn();
const mockOnFeedbackShortcutUsed = jest.fn();
const mockOnFeedbackShortcutsHelpOpened = jest.fn();

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
      <span data-testid={`selected-${inputId}`}>{value?.label ?? placeholder}</span>
      {options.map((opt) => (
        <button key={opt.value} type="button" onClick={() => onChange(opt)}>
          {opt.label}
        </button>
      ))}
      <input
        id={inputId}
        aria-label={inputId === 'app' ? 'Which app is this about?' : inputId}
        readOnly
        value={value?.label ?? ''}
      />
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
    onFeedbackTooLarge: mockOnFeedbackTooLarge,
    onFeedbackShortcutUsed: mockOnFeedbackShortcutUsed,
    onFeedbackShortcutsHelpOpened: mockOnFeedbackShortcutsHelpOpened,
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

/** Drafts are per app: a draft written on one app's page never opens on another's. */
const APP_1_DRAFT_KEY = `${AI_APP_FEEDBACK_DRAFT_KEY}:app-1`;

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
    clearFormDraft(APP_1_DRAFT_KEY);
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
        { appUid: 'app-1', text: 'Nice app!', reportKind: 'bug', priority: 'P2' },
        expect.objectContaining({ onSuccess: expect.any(Function), onError: expect.any(Function) }),
      ),
    );
    expect(mockContactSupportMutate).not.toHaveBeenCalled();
  });

  describe('pins and context (feedback in context)', () => {
    const pin = {
      id: 'pin-1',
      element: {
        selector: '#save',
        tag: 'button',
        text: 'Save',
        html: '<button id="save">Save</button>',
        role: null,
        ariaLabel: null,
        component: null,
        source: null,
        rect: { x: 1, y: 2, w: 3, h: 4 },
        page: { path: '/settings', title: 'Settings', viewportW: 800, viewportH: 600 },
      },
      rect: { x: 1, y: 2, w: 3, h: 4 },
      note: 'Hard to see',
      crop: { status: 'pending' as const },
      point: null,
    };
    const context = {
      env: 'preview' as const,
      appPath: '/settings',
      labosUrl: 'https://directory.example/pl-infra/ai-apps/app-1/settings',
      viewport: { w: 800, h: 600 },
      pixelRatio: 2,
      touch: false,
      userAgent: 'jest',
      bridge: { version: 1, capabilities: ['pick', 'locate'] },
    };

    beforeEach(() =>
      mockUseAiApps.mockReturnValue({
        apps: [
          { uid: 'app-1', name: 'My App' },
          { uid: 'app-2', name: 'Other App' },
        ],
        isLoading: false,
        isError: false,
      }),
    );

    it('sends the pins as data, with where they were made, for the app on screen', async () => {
      render(
        <GiveAiAppFeedbackDialog
          isOpen
          onClose={jest.fn()}
          appUid="app-1"
          appName="My App"
          pins={[pin]}
          getContext={() => context}
        />,
      );
      fireEvent.click(screen.getByRole('button', { name: 'Send feedback' }));

      await waitFor(() => expect(mockMutate).toHaveBeenCalled());
      const [payload] = mockMutate.mock.calls[0];
      expect(payload.context).toEqual(context);
      expect(payload.pins).toEqual([
        expect.objectContaining({
          n: 1,
          env: 'preview',
          pagePath: '/settings',
          selector: '#save',
          note: 'Hard to see',
        }),
      ]);
      expect(payload.text).toContain('Pinned elements');
    });

    it('sends neither when the feedback is switched to another app', async () => {
      render(
        <GiveAiAppFeedbackDialog
          isOpen
          onClose={jest.fn()}
          appUid="app-1"
          appName="My App"
          pins={[pin]}
          getContext={() => context}
        />,
      );
      fireEvent.click(screen.getByRole('button', { name: 'Other App' }));
      fireEvent.click(screen.getByRole('button', { name: 'Send feedback' }));

      await waitFor(() => expect(mockMutate).toHaveBeenCalled());
      const [payload] = mockMutate.mock.calls[0];
      expect(payload.appUid).toBe('app-2');
      expect(payload).not.toHaveProperty('pins');
      expect(payload).not.toHaveProperty('context');
      /* The readable copy still says what was pinned. */
      expect(payload.text).toContain('Pinned elements');
    });
  });

  it('submits the note as markdown', async () => {
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
        { appUid: 'app-1', text: '**Nice app!**', reportKind: 'bug', priority: 'P2' },
        expect.objectContaining({ onSuccess: expect.any(Function) }),
      ),
    );
  });

  it('opens on Rich; Markdown shows the source of the same note, and switching back keeps it', () => {
    mockUseAiApps.mockReturnValue({ apps: [{ uid: 'app-1', name: 'My App' }], isLoading: false, isError: false });
    render(<GiveAiAppFeedbackDialog isOpen onClose={jest.fn()} appUid="app-1" appName="My App" />);
    const rich =
      '<h2>Title</h2><ul><li>one</li></ul><p><a href="https://x.test">link</a> <img src="https://cdn.test/i.png" alt="pic"></p>';

    expect(screen.getByRole('tab', { name: 'Rich' })).toHaveAttribute('aria-selected', 'true');
    fireEvent.change(screen.getByPlaceholderText(FEEDBACK_PLACEHOLDER), { target: { value: rich } });
    fireEvent.click(screen.getByRole('tab', { name: 'Markdown' }));

    expect(screen.getByPlaceholderText(FEEDBACK_PLACEHOLDER)).toHaveValue(
      '## Title\n\n- one\n\n[link](https://x.test) ![pic](https://cdn.test/i.png)',
    );

    fireEvent.click(screen.getByRole('tab', { name: 'Rich' }));
    expect(screen.getByPlaceholderText(FEEDBACK_PLACEHOLDER)).toHaveValue(rich);
  });

  it('sends what is typed in Markdown as typed, < > and & included', async () => {
    mockUseAiApps.mockReturnValue({ apps: [{ uid: 'app-1', name: 'My App' }], isLoading: false, isError: false });
    render(<GiveAiAppFeedbackDialog isOpen onClose={jest.fn()} appUid="app-1" appName="My App" />);
    const source = '# Bug\n\na < b && c > d\n\n- one\n- two';

    fireEvent.click(screen.getByRole('tab', { name: 'Markdown' }));
    fireEvent.change(screen.getByPlaceholderText(FEEDBACK_PLACEHOLDER), { target: { value: source } });
    expect(screen.getByPlaceholderText(FEEDBACK_PLACEHOLDER)).toHaveValue(source);
    fireEvent.click(screen.getByRole('button', { name: 'Send feedback' }));

    await waitFor(() =>
      expect(mockMutate).toHaveBeenCalledWith(
        { appUid: 'app-1', text: source, reportKind: 'bug', priority: 'P2' },
        expect.any(Object),
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
        { appUid: 'app-1', text: '![shot](https://cdn.test/shot.png)', reportKind: 'bug', priority: 'P2' },
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
          message: '<p>Platform needs better docs</p>',
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
        { appUid: 'app-1', text: '![](https://cdn.test/hosted.png)', reportKind: 'bug', priority: 'P2' },
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

  it('shows Kind and Priority under the note, starting at bug and P2, and sends what is picked', async () => {
    mockUseAiApps.mockReturnValue({ apps: [{ uid: 'app-1', name: 'My App' }], isLoading: false, isError: false });
    render(<GiveAiAppFeedbackDialog isOpen onClose={jest.fn()} appUid="app-1" appName="My App" bridgeMissing />);

    expect(screen.getByText('Kind')).toBeInTheDocument();
    expect(screen.getByText('Priority')).toBeInTheDocument();
    expect(screen.getByTestId('selected-reportKind')).toHaveTextContent('bug');
    expect(screen.getByTestId('selected-priority')).toHaveTextContent('P2 — Normal — worth doing, not urgent');
    for (const label of [
      'P0 — Blocking — nobody can work around this',
      'P1 — Serious — there is a workaround and it hurts',
      'P3 — Someday — a good idea with no clock on it',
      'request',
      'question',
      'chore',
    ]) {
      expect(screen.getByRole('button', { name: label })).toBeInTheDocument();
    }

    fireEvent.click(screen.getByRole('button', { name: 'request' }));
    fireEvent.click(screen.getByRole('button', { name: 'P0 — Blocking — nobody can work around this' }));
    fireEvent.change(screen.getByPlaceholderText(FEEDBACK_PLACEHOLDER), { target: { value: 'Nice app!' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send feedback' }));

    await waitFor(() =>
      expect(mockMutate).toHaveBeenCalledWith(
        { appUid: 'app-1', text: 'Nice app!', reportKind: 'request', priority: 'P0' },
        expect.any(Object),
      ),
    );
  });

  it('shows Kind and Priority when opened from the apps list, with no app on screen', () => {
    mockUseAiApps.mockReturnValue({ apps: [{ uid: 'app-1', name: 'My App' }], isLoading: false, isError: false });
    render(<GiveAiAppFeedbackDialog isOpen onClose={jest.fn()} />);

    expect(screen.getByTestId('selected-reportKind')).toHaveTextContent('bug');
    expect(screen.getByTestId('selected-priority')).toHaveTextContent('P2 — Normal — worth doing, not urgent');
  });

  it('keeps the picked Kind and Priority in the draft and restores them', async () => {
    mockUseAiApps.mockReturnValue({ apps: [{ uid: 'app-1', name: 'My App' }], isLoading: false, isError: false });
    const { rerender } = render(<GiveAiAppFeedbackDialog isOpen onClose={jest.fn()} appUid="app-1" appName="My App" />);

    fireEvent.change(screen.getByPlaceholderText(FEEDBACK_PLACEHOLDER), { target: { value: 'Half a thought' } });
    fireEvent.click(screen.getByRole('button', { name: 'chore' }));
    fireEvent.click(screen.getByRole('button', { name: 'P3 — Someday — a good idea with no clock on it' }));
    await waitFor(() =>
      expect(JSON.parse(window.localStorage.getItem(APP_1_DRAFT_KEY) ?? '{}').data).toMatchObject({
        reportKind: 'chore',
        priority: 'P3',
      }),
    );

    rerender(<GiveAiAppFeedbackDialog isOpen={false} onClose={jest.fn()} appUid="app-1" appName="My App" />);
    rerender(<GiveAiAppFeedbackDialog isOpen onClose={jest.fn()} appUid="app-1" appName="My App" />);

    await waitFor(() => expect(screen.getByTestId('selected-reportKind')).toHaveTextContent('chore'));
    expect(screen.getByTestId('selected-priority')).toHaveTextContent('P3 — Someday — a good idea with no clock on it');
  });

  it('restores a typed draft when the dialog is reopened', async () => {
    writeFormDraft(APP_1_DRAFT_KEY, { message: 'Draft feedback text' });
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

  it("doesn't restore one app's draft on another app", async () => {
    writeFormDraft(APP_1_DRAFT_KEY, { message: 'Draft feedback text' });
    mockUseAiApps.mockReturnValue({
      apps: [
        { uid: 'app-1', name: 'My App' },
        { uid: 'app-2', name: 'Other App' },
      ],
      isLoading: false,
      isError: false,
    });

    render(<GiveAiAppFeedbackDialog isOpen onClose={jest.fn()} appUid="app-2" appName="Other App" />);

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    expect(screen.getByPlaceholderText(FEEDBACK_PLACEHOLDER)).toHaveValue('');
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

    expect(readFormDraft<{ message: string }>(APP_1_DRAFT_KEY)?.message).toBe('Draft feedback text');
    jest.useRealTimers();
  });

  it('clears the draft after a successful submit', async () => {
    writeFormDraft(APP_1_DRAFT_KEY, { message: 'Should be cleared' });
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
      expect(readFormDraft(APP_1_DRAFT_KEY)).toBeNull();
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

  /* Opening this form from comment mode: the button measured on open is still
     shifted beside the comments panel, then moves back when the page drops
     --ai-app-comments-inset from the root's style (dev, 2026-10-02). */
  it('follows the button when the page moves it by changing the root style', async () => {
    mockUseAiApps.mockReturnValue({ apps: [], isLoading: false, isError: false });
    const anchor = document.createElement('button');
    document.body.appendChild(anchor);
    const rect = (right: number) =>
      ({
        x: right - 160,
        y: 600,
        top: 600,
        bottom: 640,
        left: right - 160,
        right,
        width: 160,
        height: 40,
        toJSON: () => ({}),
      }) as DOMRect;
    const measure = jest.spyOn(anchor, 'getBoundingClientRect').mockReturnValue(rect(596));
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1000 });
    document.documentElement.style.setProperty('--ai-app-comments-inset', '380px');

    render(<GiveAiAppFeedbackDialog isOpen onClose={jest.fn()} anchorRef={{ current: anchor }} placement="above" />);
    const overlayStyle = () =>
      document.body.querySelector('[style*="--feedback-popover-right"]')?.getAttribute('style');
    expect(overlayStyle()).toContain('--feedback-popover-right: 404px');

    measure.mockReturnValue(rect(976));
    await act(async () => {
      document.documentElement.style.removeProperty('--ai-app-comments-inset');
    });

    expect(overlayStyle()).toContain('--feedback-popover-right: 24px');
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

  it('turns the popup into the wide drawer and back, remembering the choice', () => {
    mockUseAiApps.mockReturnValue({ apps: [], isLoading: false, isError: false });
    const { rerender } = render(<GiveAiAppFeedbackDialog isOpen onClose={jest.fn()} placement="above" />);
    const overlay = () => document.body.querySelector('[data-modal]');

    expect(overlay()).not.toHaveClass('overlayWide');
    fireEvent.click(screen.getByRole('button', { name: 'Wider' }));

    expect(overlay()).toHaveClass('overlayWide');
    expect(screen.getByRole('button', { name: 'Narrower' })).toHaveAttribute('title', 'Narrower');
    expect(window.localStorage.getItem('ai-app-feedback:wide')).toBe('1');

    rerender(<GiveAiAppFeedbackDialog isOpen={false} onClose={jest.fn()} placement="above" />);
    rerender(<GiveAiAppFeedbackDialog isOpen onClose={jest.fn()} placement="above" />);
    expect(overlay()).toHaveClass('overlayWide');

    fireEvent.click(screen.getByRole('button', { name: 'Narrower' }));
    expect(overlay()).not.toHaveClass('overlayWide');
    expect(screen.getByRole('button', { name: 'Wider' })).toHaveAttribute('title', 'Wider');
    expect(window.localStorage.getItem('ai-app-feedback:wide')).toBe('0');
  });

  it('opens as the popup when the browser cannot store the choice', () => {
    mockUseAiApps.mockReturnValue({ apps: [], isLoading: false, isError: false });
    window.localStorage.setItem('ai-app-feedback:wide', '1');
    const getItem = jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });

    render(<GiveAiAppFeedbackDialog isOpen onClose={jest.fn()} />);

    expect(document.body.querySelector('[data-modal]')).not.toHaveClass('overlayWide');
    expect(screen.getByRole('button', { name: 'Wider' })).toBeInTheDocument();
    getItem.mockRestore();
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
    /* Without the app's capture script the section keeps today's screen share. */
    expect(screen.getByText('Screenshots', { selector: 'p' })).toBeInTheDocument();
    expect(screen.getByText(/Share this tab and drag to capture an area/)).toBeInTheDocument();
    expect(screen.getByText(/draw and annotate/)).toBeInTheDocument();
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

      fireEvent.click(screen.getByRole('button', { name: 'Annotate screenshot 1' }));

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

      fireEvent.click(screen.getByRole('button', { name: 'Annotate screenshot 1' }));
      await waitFor(() => expect(screen.getByRole('button', { name: 'Save changes' })).toBeInTheDocument());
      fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));

      await waitFor(() => expect(screen.getByAltText('Screenshot 1')).toBeInTheDocument());
      expect(screen.queryByAltText('Screenshot 2')).not.toBeInTheDocument();
    });

    it('leaves the capture alone when the edit is cancelled', async () => {
      await takeAndAdd();

      fireEvent.click(screen.getByRole('button', { name: 'Annotate screenshot 1' }));
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

      fireEvent.click(screen.getByRole('button', { name: 'Annotate screenshot 1' }));
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

    it('deletes on Enter and keeps the screenshot on Escape', async () => {
      await takeAndAnnotate();

      fireEvent.click(screen.getByRole('button', { name: 'Remove screenshot 1' }));
      fireEvent.keyDown(document, { key: 'Escape' });

      expect(screen.queryByText('Delete screenshot?')).not.toBeInTheDocument();
      expect(screen.getByAltText('Screenshot 1')).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: 'Remove screenshot 1' }));
      fireEvent.keyDown(document, { key: 'Enter' });

      await waitFor(() => expect(screen.queryByAltText('Screenshot 1')).not.toBeInTheDocument());
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

      fireEvent.click(screen.getByRole('button', { name: 'Annotate screenshot 1' }));
      expect(mockOnFeedbackScreenshotEditOpened).toHaveBeenCalled();
      await waitFor(() => expect(screen.getByRole('button', { name: 'Save changes' })).toBeInTheDocument());

      fireEvent.click(screen.getByRole('button', { name: 'Comment' }));
      expect(mockOnFeedbackScreenshotToolSelected).toHaveBeenCalledWith({ tool: 'comment' });

      fireEvent.click(screen.getByRole('button', { name: 'Discard changes' }));
      expect(mockOnFeedbackScreenshotAnnotatorDiscarded).toHaveBeenCalledWith({ isEditing: true });

      fireEvent.click(screen.getByRole('button', { name: 'Annotate screenshot 1' }));
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

  describe('keyboard shortcuts', () => {
    const apps = () =>
      mockUseAiApps.mockReturnValue({
        apps: [{ uid: 'app-1', name: 'My App' }],
        isLoading: false,
        isError: false,
      });

    const sendChord = () => fireEvent.keyDown(document, { key: 'Enter', ctrlKey: true });

    it('starts a screenshot from Cmd/Ctrl+Shift+S', async () => {
      (requestTabCapture as jest.Mock).mockResolvedValue({ getTracks: () => [{ stop: jest.fn() }] });
      (grabVideoFrame as jest.Mock).mockResolvedValue(PIXEL_PNG);
      (stopCaptureStream as jest.Mock).mockImplementation(() => undefined);
      apps();
      render(<GiveAiAppFeedbackDialog isOpen onClose={jest.fn()} appUid="app-1" appName="My App" />);

      expect(screen.getByRole('button', { name: 'Take screenshot' })).toHaveAttribute(
        'aria-keyshortcuts',
        expect.stringMatching(/Shift\+S/),
      );
      fireEvent.keyDown(document, { key: 's', ctrlKey: true, shiftKey: true });

      await waitFor(() => expect(screen.getByRole('button', { name: 'Select region' })).toBeInTheDocument());
      expect(mockOnFeedbackScreenshotClicked).toHaveBeenCalled();
      expect(mockOnFeedbackShortcutUsed).toHaveBeenCalledWith({ action: 'screenshot' });
    });

    it('does not treat Cmd/Ctrl+S as a screenshot', () => {
      apps();
      render(<GiveAiAppFeedbackDialog isOpen onClose={jest.fn()} appUid="app-1" appName="My App" />);

      fireEvent.keyDown(document, { key: 's', ctrlKey: true });

      expect(mockOnFeedbackScreenshotClicked).not.toHaveBeenCalled();
    });

    it('opens the shortcut list without closing the dialog', async () => {
      apps();
      const onClose = jest.fn();
      render(<GiveAiAppFeedbackDialog isOpen onClose={onClose} appUid="app-1" appName="My App" />);

      fireEvent.click(screen.getByRole('button', { name: 'Shortcuts' }));

      expect(mockOnFeedbackShortcutsHelpOpened).toHaveBeenCalled();
      expect(screen.getByRole('heading', { name: 'Keyboard shortcuts' })).toBeInTheDocument();
      expect(screen.getByText('Take screenshot', { selector: 'span' })).toBeInTheDocument();

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(onClose).not.toHaveBeenCalled();
      await waitFor(() =>
        expect(screen.queryByRole('heading', { name: 'Keyboard shortcuts' })).not.toBeInTheDocument(),
      );
      expect(screen.getByRole('heading', { name: 'Give feedback' })).toBeInTheDocument();
    });

    it('opens and closes the shortcut list on ?, outside text fields', async () => {
      apps();
      const onClose = jest.fn();
      render(<GiveAiAppFeedbackDialog isOpen onClose={onClose} appUid="app-1" appName="My App" />);

      fireEvent.keyDown(screen.getByPlaceholderText(FEEDBACK_PLACEHOLDER), { key: '?', shiftKey: true });
      expect(screen.queryByRole('heading', { name: 'Keyboard shortcuts' })).not.toBeInTheDocument();

      fireEvent.keyDown(document, { key: '?', shiftKey: true });
      expect(screen.getByRole('heading', { name: 'Keyboard shortcuts' })).toBeInTheDocument();
      expect(mockOnFeedbackShortcutsHelpOpened).toHaveBeenCalled();

      fireEvent.keyDown(document, { key: '?', shiftKey: true });
      await waitFor(() =>
        expect(screen.queryByRole('heading', { name: 'Keyboard shortcuts' })).not.toBeInTheDocument(),
      );
      expect(onClose).not.toHaveBeenCalled();
    });

    it('lists the keys that work', () => {
      apps();
      render(<GiveAiAppFeedbackDialog isOpen onClose={jest.fn()} appUid="app-1" appName="My App" />);

      fireEvent.click(screen.getByRole('button', { name: 'Shortcuts' }));

      const row = (label: string) => screen.getAllByText(label, { selector: 'span' })[0].closest('li');
      expect(row('Open feedback')).toHaveTextContent('Alt+F or Ctrl+Alt+Enter');
      expect(row('Next or previous field')).toHaveTextContent('Tab or Shift+Tab');
      expect(row('Cancel picking a part')).toHaveTextContent('Esc');
      expect(row('Redo')).toHaveTextContent('Ctrl+Shift+Z or Ctrl+Y');
      expect(row('Show or hide')).toHaveTextContent('?');
    });

    it('notes when the app has no bridge for instant screenshots', () => {
      apps();
      const { rerender } = render(
        <GiveAiAppFeedbackDialog isOpen onClose={jest.fn()} appUid="app-1" appName="My App" bridgeMissing />,
      );

      expect(screen.getByText(/older starter kit/)).toBeInTheDocument();

      rerender(<GiveAiAppFeedbackDialog isOpen onClose={jest.fn()} appUid="app-1" appName="My App" />);
      expect(screen.queryByText(/older starter kit/)).not.toBeInTheDocument();
    });

    it('shows the send and close keys on their buttons', () => {
      apps();
      render(<GiveAiAppFeedbackDialog isOpen onClose={jest.fn()} appUid="app-1" appName="My App" />);

      const send = screen.getByRole('button', { name: 'Send feedback' });
      const cancel = screen.getByRole('button', { name: 'Cancel' });
      expect(send.querySelector('kbd')).toBeInTheDocument();
      expect(send).toHaveAttribute('aria-keyshortcuts');
      expect(cancel.querySelector('kbd')).toHaveTextContent('Esc');
      expect(cancel).toHaveAttribute('aria-keyshortcuts', 'Escape');
    });

    it('submits on Cmd/Ctrl+Enter', async () => {
      apps();
      render(<GiveAiAppFeedbackDialog isOpen onClose={jest.fn()} appUid="app-1" appName="My App" />);

      fireEvent.change(screen.getByPlaceholderText(FEEDBACK_PLACEHOLDER), { target: { value: 'Nice app!' } });
      sendChord();

      await waitFor(() =>
        expect(mockMutate).toHaveBeenCalledWith(
          { appUid: 'app-1', text: 'Nice app!', reportKind: 'bug', priority: 'P2' },
          expect.objectContaining({ onSuccess: expect.any(Function) }),
        ),
      );
      expect(mockOnFeedbackShortcutUsed).toHaveBeenCalledWith({ action: 'submit' });
    });

    it('shows validation instead of sending when the form is invalid', async () => {
      apps();
      render(<GiveAiAppFeedbackDialog isOpen onClose={jest.fn()} />);

      sendChord();

      await waitFor(() => expect(screen.getByText('Please select an app')).toBeInTheDocument());
      expect(mockMutate).not.toHaveBeenCalled();
      expect(mockOnFeedbackShortcutUsed).toHaveBeenCalledWith({ action: 'submit' });
    });

    it('does not send on Ctrl+Alt+Enter', () => {
      apps();
      const onClose = jest.fn();
      render(<GiveAiAppFeedbackDialog isOpen onClose={onClose} appUid="app-1" appName="My App" />);

      fireEvent.change(screen.getByPlaceholderText(FEEDBACK_PLACEHOLDER), { target: { value: 'Nice app!' } });
      fireEvent.keyDown(document, { key: 'Enter', ctrlKey: true, altKey: true });

      expect(mockMutate).not.toHaveBeenCalled();
      expect(onClose).not.toHaveBeenCalled();
    });

    it('ignores the send chord while a capture is in progress', async () => {
      (requestTabCapture as jest.Mock).mockResolvedValue({ getTracks: () => [{ stop: jest.fn() }] });
      (grabVideoFrame as jest.Mock).mockResolvedValue(PIXEL_PNG);
      (stopCaptureStream as jest.Mock).mockImplementation(() => undefined);
      apps();
      render(<GiveAiAppFeedbackDialog isOpen onClose={jest.fn()} appUid="app-1" appName="My App" />);

      fireEvent.change(screen.getByPlaceholderText(FEEDBACK_PLACEHOLDER), { target: { value: 'Nice app!' } });
      fireEvent.click(screen.getByRole('button', { name: 'Take screenshot' }));
      await waitFor(() => expect(screen.getByRole('button', { name: 'Select region' })).toBeInTheDocument());

      sendChord();

      expect(mockMutate).not.toHaveBeenCalled();
    });

    it('adds the screenshot from the annotator instead of sending the feedback', async () => {
      (requestTabCapture as jest.Mock).mockResolvedValue({ getTracks: () => [{ stop: jest.fn() }] });
      (grabVideoFrame as jest.Mock).mockResolvedValue(PIXEL_PNG);
      (stopCaptureStream as jest.Mock).mockImplementation(() => undefined);
      apps();
      render(<GiveAiAppFeedbackDialog isOpen onClose={jest.fn()} appUid="app-1" appName="My App" />);

      fireEvent.change(screen.getByPlaceholderText(FEEDBACK_PLACEHOLDER), { target: { value: 'Nice app!' } });
      fireEvent.click(screen.getByRole('button', { name: 'Take screenshot' }));
      await waitFor(() => expect(screen.getByRole('button', { name: 'Select region' })).toBeInTheDocument());
      fireEvent.click(screen.getByRole('button', { name: 'Select region' }));
      await waitFor(() => expect(screen.getByRole('button', { name: 'Add to feedback' })).toBeInTheDocument());

      sendChord();

      await waitFor(() => expect(screen.getByAltText('Screenshot 1')).toBeInTheDocument());
      expect(mockMutate).not.toHaveBeenCalled();
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

/**
 * A submission too large to send is refused here, with a reason.
 *
 * The server caps the SERIALIZED string; the editor caps VISIBLE characters
 * with markup stripped. Those measure different things, so the editor's limit
 * never fires first and the member used to meet a raw validation error naming a
 * character count for text they did not write.
 */
describe('GiveAiAppFeedbackDialog oversized submission', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'isSecureContext', { configurable: true, value: true });
    Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: { getDisplayMedia: jest.fn() } });
    window.localStorage.clear();
    mockUseCurrentUserStore.mockReturnValue({
      currentUser: { uid: 'member-1', name: 'Ada Lovelace', email: 'ada@example.com' },
    });
    mockUseAiApps.mockReturnValue({ apps: [{ uid: 'app-1', name: 'My App' }], isLoading: false, isError: false });
  });

  afterEach(() => {
    jest.clearAllMocks();
    clearFormDraft(AI_APP_FEEDBACK_DRAFT_KEY);
  });

  /* In the Markdown view, where markup is kept as typed. */
  const typeSource = (text: string) => {
    fireEvent.click(screen.getByRole('tab', { name: 'Markdown' }));
    fireEvent.change(screen.getByPlaceholderText(FEEDBACK_PLACEHOLDER), { target: { value: text } });
  };

  const submitText = async (text: string) => {
    render(<GiveAiAppFeedbackDialog isOpen onClose={jest.fn()} appUid="app-1" appName="My App" />);
    typeSource(text);
    fireEvent.click(screen.getByRole('button', { name: 'Send feedback' }));
  };

  /**
   * The real shape of the failure: two words of prose and an enormous
   * `data-annotations` attribute.
   *
   * It has to be this shape rather than 200k of plain text — 200k of prose is
   * over the editor's own 5000 visible-character limit, so Send is disabled and
   * the payload guard is never reached. Only markup can be small to the editor
   * and huge to the server, which is exactly why the server used to be the one
   * refusing it.
   */
  const bigDrawing = `<p>it broke</p><img src="https://cdn.test/s.png" data-annotations="${'A'.repeat(200_000)}">`;

  it('refuses a payload past the server cap instead of letting the server reject it', async () => {
    await submitText(bigDrawing);

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith(expect.stringMatching(/too large to send/)));
    expect(mockMutate).not.toHaveBeenCalled();
  });

  /* The editor's own limit cannot catch this: the visible text is two words. */
  it('is not caught by the visible-character limit', async () => {
    render(<GiveAiAppFeedbackDialog isOpen onClose={jest.fn()} appUid="app-1" appName="My App" />);
    typeSource(bigDrawing);

    expect(screen.getByRole('button', { name: 'Send feedback' })).not.toBeDisabled();
  });

  it('records the length, so we learn whether 200k was the right number', async () => {
    await submitText(bigDrawing);

    await waitFor(() => expect(mockOnFeedbackTooLarge).toHaveBeenCalled());
    expect(mockOnFeedbackTooLarge.mock.calls[0][0].length).toBeGreaterThan(199_000);
  });

  it('lets an ordinary submission through untouched', async () => {
    await submitText('Something went wrong on the settings page.');

    await waitFor(() => expect(mockMutate).toHaveBeenCalled());
    expect(mockOnFeedbackTooLarge).not.toHaveBeenCalled();
    expect(toast.error).not.toHaveBeenCalled();
  });
});
