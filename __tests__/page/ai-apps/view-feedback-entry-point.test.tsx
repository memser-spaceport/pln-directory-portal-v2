import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { ViewFeedbackEntryPoint } from '@/components/page/ai-apps/components/ViewFeedbackEntryPoint';

const mockUseAiAppFeedbackReviewAccess = jest.fn();
const mockUseAiAppFeedbackList = jest.fn();

jest.mock('@/services/ai-app-feedback/hooks/useAiAppFeedbackReviewAccess', () => ({
  useAiAppFeedbackReviewAccess: () => mockUseAiAppFeedbackReviewAccess(),
}));

jest.mock('@/services/ai-app-feedback/hooks/useAiAppFeedbackList', () => ({
  useAiAppFeedbackList: () => mockUseAiAppFeedbackList(),
}));

describe('ViewFeedbackEntryPoint', () => {
  beforeEach(() => {
    mockUseAiAppFeedbackList.mockReturnValue({
      feedback: [{ uid: 'fb-1' }],
      isLoading: false,
      isError: false,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders a link to the review page when the member can review feedback', () => {
    mockUseAiAppFeedbackReviewAccess.mockReturnValue({ canReview: true, isLoading: false });

    render(<ViewFeedbackEntryPoint />);

    const link = screen.getByRole('link', { name: /View feedback/ });
    expect(link).toHaveAttribute('href', '/pl-infra/ai-apps/feedback');
  });

  it('hides View feedback while access is loading', () => {
    mockUseAiAppFeedbackReviewAccess.mockReturnValue({ canReview: false, isLoading: true });

    render(<ViewFeedbackEntryPoint />);

    expect(screen.queryByRole('link', { name: /View feedback/ })).not.toBeInTheDocument();
  });

  it('hides View feedback while feedback is loading', () => {
    mockUseAiAppFeedbackReviewAccess.mockReturnValue({ canReview: true, isLoading: false });
    mockUseAiAppFeedbackList.mockReturnValue({ feedback: [], isLoading: true, isError: false });

    render(<ViewFeedbackEntryPoint />);

    expect(screen.queryByRole('link', { name: /View feedback/ })).not.toBeInTheDocument();
  });

  it('hides View feedback for members who cannot review feedback', () => {
    mockUseAiAppFeedbackReviewAccess.mockReturnValue({ canReview: false, isLoading: false });

    render(<ViewFeedbackEntryPoint />);

    expect(screen.queryByRole('link', { name: /View feedback/ })).not.toBeInTheDocument();
  });

  it('hides View feedback when there is no feedback to view', () => {
    mockUseAiAppFeedbackReviewAccess.mockReturnValue({ canReview: true, isLoading: false });
    mockUseAiAppFeedbackList.mockReturnValue({ feedback: [], isLoading: false, isError: false });

    render(<ViewFeedbackEntryPoint />);

    expect(screen.queryByRole('link', { name: /View feedback/ })).not.toBeInTheDocument();
  });

  it("always links to the member's own feedback, even when they cannot review any", () => {
    mockUseAiAppFeedbackReviewAccess.mockReturnValue({ canReview: false, isLoading: false });
    mockUseAiAppFeedbackList.mockReturnValue({ feedback: [], isLoading: false, isError: false });

    render(<ViewFeedbackEntryPoint />);

    expect(screen.getByRole('link', { name: 'Your feedback' })).toHaveAttribute(
      'href',
      '/pl-infra/ai-apps/feedback/mine',
    );
  });

  it('shows the total feedback count as a badge (not an "unread" count)', () => {
    mockUseAiAppFeedbackReviewAccess.mockReturnValue({ canReview: true, isLoading: false });
    mockUseAiAppFeedbackList.mockReturnValue({
      feedback: [{ uid: 'fb-1' }, { uid: 'fb-2' }, { uid: 'fb-3' }],
      isLoading: false,
      isError: false,
    });

    render(<ViewFeedbackEntryPoint />);

    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.queryByText(/new/i)).not.toBeInTheDocument();
  });
});
