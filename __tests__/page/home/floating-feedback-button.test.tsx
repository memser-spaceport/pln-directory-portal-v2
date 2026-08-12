import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import { FloatingFeedbackButton } from '@/components/page/home/FloatingFeedbackButton';

const mockOpenModal = jest.fn();
const mockOnFeedbackButtonClicked = jest.fn();

jest.mock('@/services/contact-support/store', () => ({
  useContactSupportStore: (selector: any) => selector({ actions: { openModal: mockOpenModal } }),
}));

jest.mock('@/analytics/home.analytics', () => ({
  useHomeAnalytics: () => ({ onFeedbackButtonClicked: mockOnFeedbackButtonClicked }),
}));

describe('FloatingFeedbackButton (home)', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders the floating "Give feedback" trigger', () => {
    render(<FloatingFeedbackButton />);

    expect(screen.getByRole('button', { name: 'Give feedback' })).toBeInTheDocument();
  });

  it('opens the contact support "give feedback" dialog and reports analytics on click', () => {
    render(<FloatingFeedbackButton />);

    fireEvent.click(screen.getByRole('button', { name: 'Give feedback' }));

    expect(mockOnFeedbackButtonClicked).toHaveBeenCalledTimes(1);
    expect(mockOpenModal).toHaveBeenCalledWith(undefined, 'giveFeedback');
  });
});
