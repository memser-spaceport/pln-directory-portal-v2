import '@testing-library/jest-dom';
import { act, render, screen, fireEvent, waitFor } from '@testing-library/react';
import {
  FEEDBACK_PLACEHOLDER,
  GiveAiAppFeedbackDialog,
} from '@/components/page/ai-apps/components/GiveAiAppFeedbackDialog';

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

/**
 * LAB-2767: the floating button's drawer (prototype ai-apps-feedback-drawer).
 * The form opens in a full-height drawer on the right, titled after the app,
 * with the Feedback | Comments switcher under the title rather than in its place.
 */
describe('GiveAiAppFeedbackDialog, drawer variant', () => {
  beforeEach(() => {
    asCapableBrowser();
    window.localStorage.clear();
    mockUseCurrentUserStore.mockReturnValue({
      currentUser: { uid: 'member-1', name: 'Ada Lovelace', email: 'ada@example.com' },
    });
    mockUseAiApps.mockReturnValue({ apps: [{ uid: 'app-1', name: 'My App' }], isLoading: false, isError: false });
  });

  afterEach(() => {
    jest.clearAllMocks();
    document.documentElement.style.removeProperty('--ai-app-comments-inset');
  });

  const switcher = (
    <div role="tablist" aria-label="Feedback on this app">
      Switcher
    </div>
  );

  it('opens as a full-height drawer titled after the app, with no app picker', () => {
    render(<GiveAiAppFeedbackDialog variant="drawer" isOpen onClose={jest.fn()} appUid="app-1" appName="My App" />);

    const drawer = screen.getByRole('dialog', { name: 'Feedback · My App' });
    expect(drawer).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Feedback · My App' })).toBeInTheDocument();
    expect(screen.queryByLabelText('Which app is this about?')).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText(FEEDBACK_PLACEHOLDER)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Send feedback/ })).toBeInTheDocument();
  });

  it('keeps "Give feedback" and the app picker where no app is on screen', () => {
    render(<GiveAiAppFeedbackDialog variant="drawer" isOpen onClose={jest.fn()} />);

    expect(screen.getByRole('heading', { name: 'Give feedback' })).toBeInTheDocument();
    expect(screen.getByLabelText('Which app is this about?')).toBeInTheDocument();
    expect(screen.getByTestId('selected-app')).toHaveTextContent('LabOS - AI Apps');
  });

  it('puts the switcher directly under the title, not in its place', () => {
    render(
      <GiveAiAppFeedbackDialog
        variant="drawer"
        isOpen
        onClose={jest.fn()}
        appUid="app-1"
        appName="My App"
        switchSlot={switcher}
      />,
    );

    const title = screen.getByRole('heading', { name: 'Feedback · My App' });
    const tabs = screen.getByRole('tablist', { name: 'Feedback on this app' });
    expect(title).not.toContainElement(tabs);
    expect(title.parentElement).not.toContainElement(tabs);
    // The switcher follows the title in the drawer and comes before the form.
    expect(title.compareDocumentPosition(tabs) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(
      tabs.compareDocumentPosition(screen.getByPlaceholderText(FEEDBACK_PLACEHOLDER)) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it('shows the Comments body in place of the form, keeping the title and the switcher', () => {
    const { rerender } = render(
      <GiveAiAppFeedbackDialog
        variant="drawer"
        isOpen
        onClose={jest.fn()}
        appUid="app-1"
        appName="My App"
        switchSlot={switcher}
      />,
    );
    fireEvent.change(screen.getByPlaceholderText(FEEDBACK_PLACEHOLDER), { target: { value: 'Half a thought' } });

    rerender(
      <GiveAiAppFeedbackDialog
        variant="drawer"
        isOpen
        onClose={jest.fn()}
        appUid="app-1"
        appName="My App"
        switchSlot={switcher}
        altBody={<p>Comments list</p>}
      />,
    );

    expect(screen.getByText('Comments list')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Feedback · My App' })).toBeInTheDocument();
    expect(screen.getByRole('tablist', { name: 'Feedback on this app' })).toBeInTheDocument();
    // The form stays mounted (hidden), so the half-written note survives the switch.
    expect(screen.getByPlaceholderText(FEEDBACK_PLACEHOLDER).closest('[class*="paneHidden"]')).not.toBeNull();

    rerender(
      <GiveAiAppFeedbackDialog
        variant="drawer"
        isOpen
        onClose={jest.fn()}
        appUid="app-1"
        appName="My App"
        switchSlot={switcher}
      />,
    );
    expect(screen.getByPlaceholderText(FEEDBACK_PLACEHOLDER)).toHaveValue('Half a thought');
    expect(screen.getByPlaceholderText(FEEDBACK_PLACEHOLDER).closest('[class*="paneHidden"]')).toBeNull();
  });

  it('closes on Escape from the form, but leaves Escape to comment mode on the Comments tab', () => {
    const onClose = jest.fn();
    const { rerender } = render(
      <GiveAiAppFeedbackDialog
        variant="drawer"
        isOpen
        onClose={onClose}
        appUid="app-1"
        appName="My App"
        switchSlot={switcher}
        altBody={<p>Comments list</p>}
      />,
    );
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).not.toHaveBeenCalled();

    rerender(
      <GiveAiAppFeedbackDialog
        variant="drawer"
        isOpen
        onClose={onClose}
        appUid="app-1"
        appName="My App"
        switchSlot={switcher}
      />,
    );
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('narrow on an app’s page, the page gives up the drawer’s width; wide, it goes over a scrim instead', () => {
    const root = document.documentElement;
    const { rerender } = render(
      <GiveAiAppFeedbackDialog variant="drawer" isOpen onClose={jest.fn()} appUid="app-1" appName="My App" />,
    );
    expect(root.style.getPropertyValue('--ai-app-comments-inset')).toBe('480px');
    expect(screen.getByTestId('feedback-drawer')).toHaveAttribute('data-wide', 'false');

    fireEvent.click(screen.getByRole('button', { name: 'Wider' }));
    expect(screen.getByTestId('feedback-drawer')).toHaveAttribute('data-wide', 'true');
    expect(screen.getByTestId('feedback-drawer').className).toMatch(/overlayWide/);
    expect(root.style.getPropertyValue('--ai-app-comments-inset')).toBe('');

    fireEvent.click(screen.getByRole('button', { name: 'Narrower' }));
    expect(root.style.getPropertyValue('--ai-app-comments-inset')).toBe('480px');

    rerender(
      <GiveAiAppFeedbackDialog variant="drawer" isOpen={false} onClose={jest.fn()} appUid="app-1" appName="My App" />,
    );
    expect(root.style.getPropertyValue('--ai-app-comments-inset')).toBe('');
    expect(screen.queryByTestId('feedback-drawer')).not.toBeInTheDocument();
  });

  it('the Comments tab is always the narrow drawer', () => {
    render(
      <GiveAiAppFeedbackDialog
        variant="drawer"
        isOpen
        onClose={jest.fn()}
        appUid="app-1"
        appName="My App"
        switchSlot={switcher}
        altBody={<p>Comments list</p>}
      />,
    );
    expect(screen.queryByRole('button', { name: 'Wider' })).not.toBeInTheDocument();
    expect(screen.getByTestId('feedback-drawer')).toHaveAttribute('data-wide', 'false');
  });

  it('moves focus into the drawer when it opens', () => {
    render(<GiveAiAppFeedbackDialog variant="drawer" isOpen onClose={jest.fn()} appUid="app-1" appName="My App" />);
    expect(screen.getByRole('dialog', { name: 'Feedback · My App' })).toContainElement(
      document.activeElement as HTMLElement,
    );
  });

  it('does not reserve page width on the list, where there is no app beside it', () => {
    render(<GiveAiAppFeedbackDialog variant="drawer" isOpen onClose={jest.fn()} />);
    expect(document.documentElement.style.getPropertyValue('--ai-app-comments-inset')).toBe('');
  });
});
