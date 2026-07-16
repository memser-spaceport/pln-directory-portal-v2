import '@testing-library/jest-dom';
import { act, render, screen, fireEvent, waitFor } from '@testing-library/react';
import {
  AI_APP_FEEDBACK_DRAFT_KEY,
  GiveAiAppFeedbackDialog,
  LABOS_AI_APPS_OPTION,
} from '@/components/page/ai-apps/components/GiveAiAppFeedbackDialog';
import { clearFormDraft, readFormDraft, writeFormDraft } from '@/utils/formDraftStorage';

const mockUseAiApps = jest.fn();
const mockMutate = jest.fn();
const mockContactSupportMutate = jest.fn();
const mockUseCurrentUserStore = jest.fn();
const mockOnFeedbackSubmitted = jest.fn();
const mockOnFeedbackSubmitFailed = jest.fn();

const feedbackPlaceholder = 'What worked, what didn’t, and what would make this more useful?';

jest.mock('react-select', () => ({
  __esModule: true,
  default: ({
    options,
    value,
    onChange,
    inputId,
    placeholder,
  }: {
    options: Array<{ label: string; value: string }>;
    value: { label: string; value: string } | null;
    onChange: (value: { label: string; value: string } | null) => void;
    inputId?: string;
    placeholder?: string;
  }) => (
    <div>
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
  }),
}));

jest.mock('@/components/core/ToastContainer', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

describe('GiveAiAppFeedbackDialog', () => {
  beforeEach(() => {
    window.localStorage.clear();
    mockUseCurrentUserStore.mockReturnValue({
      currentUser: { uid: 'member-1', name: 'Ada Lovelace', email: 'ada@example.com' },
    });
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

    fireEvent.change(screen.getByPlaceholderText(feedbackPlaceholder), {
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
    fireEvent.change(screen.getByPlaceholderText(feedbackPlaceholder), {
      target: { value: 'Platform needs better docs' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Send feedback' }));

    await waitFor(() =>
      expect(mockContactSupportMutate).toHaveBeenCalledWith(
        {
          topic: 'Give feedback',
          email: 'ada@example.com',
          name: 'Ada Lovelace',
          message: 'AI Apps Feedback: Platform needs better docs',
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
      expect(screen.getByPlaceholderText(feedbackPlaceholder)).toHaveValue('Draft feedback text');
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

    fireEvent.change(screen.getByPlaceholderText(feedbackPlaceholder), {
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

    fireEvent.change(screen.getByPlaceholderText(feedbackPlaceholder), {
      target: { value: 'Final feedback' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Send feedback' }));

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalled();
      expect(readFormDraft(AI_APP_FEEDBACK_DRAFT_KEY)).toBeNull();
    });
  });
});
