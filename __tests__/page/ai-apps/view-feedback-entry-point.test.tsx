import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { ViewFeedbackEntryPoint } from '@/components/page/ai-apps/components/ViewFeedbackEntryPoint';

const mockUseAiAppFeedbackReviewAccess = jest.fn();
const mockUseAiAppFeedbackList = jest.fn();
const mockOnViewFeedbackClicked = jest.fn();

jest.mock('@/services/ai-app-feedback/hooks/useAiAppFeedbackReviewAccess', () => ({
  useAiAppFeedbackReviewAccess: () => mockUseAiAppFeedbackReviewAccess(),
}));

jest.mock('@/services/ai-app-feedback/hooks/useAiAppFeedbackList', () => ({
  useAiAppFeedbackList: () => mockUseAiAppFeedbackList(),
}));

jest.mock('@/analytics/ai-apps.analytics', () => ({
  useAiAppsAnalytics: () => ({ onViewFeedbackClicked: mockOnViewFeedbackClicked }),
}));

const rows = (statuses: string[]) => statuses.map((status, i) => ({ uid: `fb-${i}`, status }));

/* LAB-2767: one "Feedback" button replaces "Your feedback" and "View feedback". */
describe('ViewFeedbackEntryPoint', () => {
  beforeEach(() => {
    mockUseAiAppFeedbackList.mockReturnValue({ feedback: rows(['NEW']), isLoading: false, isError: false });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('is one Feedback link, in place of Your feedback and View feedback', () => {
    mockUseAiAppFeedbackReviewAccess.mockReturnValue({ canReview: true, isLoading: false });

    render(<ViewFeedbackEntryPoint />);

    expect(screen.getAllByRole('link')).toHaveLength(1);
    expect(screen.getByRole('link', { name: /^Feedback/ })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Your feedback/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /View feedback/ })).not.toBeInTheDocument();
  });

  it('opens Received for an admin or app creator, badged with the items still marked New', () => {
    mockUseAiAppFeedbackReviewAccess.mockReturnValue({ canReview: true, isLoading: false });
    mockUseAiAppFeedbackList.mockReturnValue({
      feedback: rows(['NEW', 'VIEWED', 'NEW', 'IMPLEMENTED', 'NEW']),
      isLoading: false,
      isError: false,
    });

    render(<ViewFeedbackEntryPoint />);

    const link = screen.getByRole('link', { name: /^Feedback/ });
    expect(link).toHaveAttribute('href', '/pl-infra/ai-apps/feedback');
    expect(link).toHaveTextContent(/^Feedback3$/);
  });

  it('caps the badge at 99+', () => {
    mockUseAiAppFeedbackReviewAccess.mockReturnValue({ canReview: true, isLoading: false });
    mockUseAiAppFeedbackList.mockReturnValue({
      feedback: rows(Array.from({ length: 120 }, () => 'NEW')),
      isLoading: false,
      isError: false,
    });

    render(<ViewFeedbackEntryPoint />);

    expect(screen.getByRole('link', { name: /^Feedback/ })).toHaveTextContent(/^Feedback99\+$/);
  });

  it('hides the badge when nothing Received is New', () => {
    mockUseAiAppFeedbackReviewAccess.mockReturnValue({ canReview: true, isLoading: false });
    mockUseAiAppFeedbackList.mockReturnValue({
      feedback: rows(['VIEWED', 'IMPLEMENTED']),
      isLoading: false,
      isError: false,
    });

    render(<ViewFeedbackEntryPoint />);

    expect(screen.getByRole('link', { name: /^Feedback/ })).toHaveTextContent(/^Feedback$/);
  });

  it('opens Given with no badge for everyone else', () => {
    mockUseAiAppFeedbackReviewAccess.mockReturnValue({ canReview: false, isLoading: false });
    mockUseAiAppFeedbackList.mockReturnValue({ feedback: rows(['NEW', 'NEW']), isLoading: false, isError: false });

    render(<ViewFeedbackEntryPoint />);

    const link = screen.getByRole('link', { name: /^Feedback/ });
    expect(link).toHaveAttribute('href', '/pl-infra/ai-apps/feedback/mine');
    expect(link).toHaveTextContent(/^Feedback$/);
  });

  it('opens Given with no badge while access is loading', () => {
    mockUseAiAppFeedbackReviewAccess.mockReturnValue({ canReview: false, isLoading: true });

    render(<ViewFeedbackEntryPoint />);

    expect(screen.getByRole('link', { name: /^Feedback/ })).toHaveAttribute('href', '/pl-infra/ai-apps/feedback/mine');
    expect(screen.getByRole('link', { name: /^Feedback/ })).toHaveTextContent(/^Feedback$/);
  });

  it('tracks the click for reviewers, as View feedback did', () => {
    mockUseAiAppFeedbackReviewAccess.mockReturnValue({ canReview: true, isLoading: false });

    render(<ViewFeedbackEntryPoint />);
    fireEvent.click(screen.getByRole('link', { name: /^Feedback/ }));

    expect(mockOnViewFeedbackClicked).toHaveBeenCalledWith({ feedbackCount: 1 });
  });
});
