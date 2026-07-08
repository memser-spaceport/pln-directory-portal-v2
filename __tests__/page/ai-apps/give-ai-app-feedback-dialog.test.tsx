import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { GiveAiAppFeedbackDialog } from '@/components/page/ai-apps/components/GiveAiAppFeedbackDialog';

const mockUseAiApps = jest.fn();
const mockMutate = jest.fn();
const mockUseCurrentUserStore = jest.fn();
const mockOnFeedbackSubmitted = jest.fn();
const mockOnFeedbackSubmitFailed = jest.fn();

jest.mock('@/services/ai-apps/hooks/useAiApps', () => ({
  useAiApps: () => mockUseAiApps(),
}));

jest.mock('@/services/ai-app-feedback/hooks/useSubmitAiAppFeedback', () => ({
  useSubmitAiAppFeedback: () => ({ mutate: mockMutate, isPending: false }),
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
    mockUseCurrentUserStore.mockReturnValue({ currentUser: { uid: 'member-1', name: 'Ada Lovelace' } });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders nothing when closed', () => {
    mockUseAiApps.mockReturnValue({ apps: [], isLoading: false, isError: false });

    render(<GiveAiAppFeedbackDialog isOpen={false} onClose={jest.fn()} appUid="app-1" appName="My App" />);

    expect(screen.queryByText('Give feedback')).not.toBeInTheDocument();
  });

  it('fixed-app mode: submits feedback for the implicit app with no picker', async () => {
    mockUseAiApps.mockReturnValue({ apps: [], isLoading: false, isError: false });
    const onClose = jest.fn();

    render(<GiveAiAppFeedbackDialog isOpen onClose={onClose} appUid="app-1" appName="My App" />);

    expect(screen.getByText(/Posting as Ada Lovelace/)).toBeInTheDocument();
    expect(screen.queryByLabelText('App')).not.toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText('Share your thoughts'), { target: { value: 'Nice app!' } });
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

    // react-hook-form's handleSubmit resolves on a microtask, so the mutate call
    // isn't synchronous with the click.
    await waitFor(() =>
      expect(mockMutate).toHaveBeenCalledWith(
        { appUid: 'app-1', message: 'Nice app!' },
        expect.objectContaining({ onSuccess: expect.any(Function), onError: expect.any(Function) }),
      ),
    );
  });

  it('picker mode: shows an empty-state message and disables submit when there are no apps to pick from', () => {
    mockUseAiApps.mockReturnValue({ apps: [], isLoading: false, isError: false });

    render(<GiveAiAppFeedbackDialog isOpen onClose={jest.fn()} />);

    expect(screen.getByText('No apps available to give feedback on yet.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Submit' })).toBeDisabled();
  });
});
