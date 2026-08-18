import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import { FeedbackButton } from '@/components/page/home/FeedbackButton';

const mockOpenModal = jest.fn();
const mockOnFeedbackButtonClicked = jest.fn();

jest.mock('@/services/contact-support/store', () => ({
  useContactSupportStore: (selector: any) => selector({ actions: { openModal: mockOpenModal } }),
}));

jest.mock('@/analytics/home.analytics', () => ({
  useHomeAnalytics: () => ({ onFeedbackButtonClicked: mockOnFeedbackButtonClicked }),
}));

describe('FeedbackButton', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders the floating feedback trigger', () => {
    render(<FeedbackButton />);

    expect(screen.getByRole('button', { name: 'Give feedback' })).toBeInTheDocument();
  });

  it('reports analytics and opens the contact support modal on the "giveFeedback" topic when clicked', () => {
    render(<FeedbackButton />);

    fireEvent.click(screen.getByRole('button', { name: 'Give feedback' }));

    expect(mockOnFeedbackButtonClicked).toHaveBeenCalledTimes(1);
    expect(mockOpenModal).toHaveBeenCalledWith(undefined, 'giveFeedback');
  });
});
