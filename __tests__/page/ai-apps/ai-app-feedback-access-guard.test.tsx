import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { AiAppFeedbackAccessGuard } from '@/components/page/ai-apps/AiAppFeedbackPage/components/AiAppFeedbackAccessGuard';

const mockUseAiAppFeedbackReviewAccess = jest.fn();

jest.mock('@/services/ai-app-feedback/hooks/useAiAppFeedbackReviewAccess', () => ({
  useAiAppFeedbackReviewAccess: () => mockUseAiAppFeedbackReviewAccess(),
}));

jest.mock('@/analytics/ai-apps.analytics', () => ({
  useAiAppsAnalytics: () => ({ onAccessDenied: jest.fn() }),
}));

describe('AiAppFeedbackAccessGuard', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders children when the member can review feedback', () => {
    mockUseAiAppFeedbackReviewAccess.mockReturnValue({ canReview: true, isLoading: false, isError: false });

    render(
      <AiAppFeedbackAccessGuard>
        <div>Feedback list</div>
      </AiAppFeedbackAccessGuard>,
    );

    expect(screen.getByText('Feedback list')).toBeInTheDocument();
  });

  it('renders nothing while access is loading', () => {
    mockUseAiAppFeedbackReviewAccess.mockReturnValue({ canReview: false, isLoading: true, isError: false });

    const { container } = render(
      <AiAppFeedbackAccessGuard>
        <div>Feedback list</div>
      </AiAppFeedbackAccessGuard>,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when the member cannot review feedback', () => {
    mockUseAiAppFeedbackReviewAccess.mockReturnValue({ canReview: false, isLoading: false, isError: false });

    const { container } = render(
      <AiAppFeedbackAccessGuard>
        <div>Feedback list</div>
      </AiAppFeedbackAccessGuard>,
    );

    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByText('Feedback list')).not.toBeInTheDocument();
  });
});
