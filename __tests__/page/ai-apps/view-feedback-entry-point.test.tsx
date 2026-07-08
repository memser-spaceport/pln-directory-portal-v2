import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { ViewFeedbackEntryPoint } from '@/components/page/ai-apps/components/ViewFeedbackEntryPoint';

const mockUseAiAppFeedbackReviewAccess = jest.fn();

jest.mock('@/services/ai-app-feedback/hooks/useAiAppFeedbackReviewAccess', () => ({
  useAiAppFeedbackReviewAccess: () => mockUseAiAppFeedbackReviewAccess(),
}));

describe('ViewFeedbackEntryPoint', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders a link to the review page when the member can review feedback', () => {
    mockUseAiAppFeedbackReviewAccess.mockReturnValue({ canReview: true, isLoading: false });

    render(<ViewFeedbackEntryPoint />);

    const link = screen.getByRole('link', { name: 'View feedback' });
    expect(link).toHaveAttribute('href', '/pl-infra/ai-apps/feedback');
  });

  it('renders nothing while access is loading', () => {
    mockUseAiAppFeedbackReviewAccess.mockReturnValue({ canReview: false, isLoading: true });

    const { container } = render(<ViewFeedbackEntryPoint />);

    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing for members who cannot review feedback', () => {
    mockUseAiAppFeedbackReviewAccess.mockReturnValue({ canReview: false, isLoading: false });

    const { container } = render(<ViewFeedbackEntryPoint />);

    expect(container).toBeEmptyDOMElement();
  });
});
