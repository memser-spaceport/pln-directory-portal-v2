import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import { FloatingFeedbackButton } from '@/components/page/home/FloatingFeedbackButton';

const mockOpenModal = jest.fn();
const mockOnFloatingFeedbackButtonClicked = jest.fn();

jest.mock('@/services/contact-support/store', () => ({
  useContactSupportStore: (selector: any) => selector({ actions: { openModal: mockOpenModal } }),
}));

jest.mock('@/services/auth/store', () => ({
  useCurrentUserStore: () => ({ currentUser: { name: 'Jane Doe', email: 'jane@example.com', roles: ['member'] } }),
}));

jest.mock('@/analytics/home.analytics', () => ({
  useHomeAnalytics: () => ({
    onFloatingFeedbackButtonClicked: mockOnFloatingFeedbackButtonClicked,
  }),
}));

describe('FloatingFeedbackButton (home)', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders the trigger button', () => {
    render(<FloatingFeedbackButton />);

    expect(screen.getByRole('button', { name: 'Give feedback' })).toBeInTheDocument();
  });

  it('opens the contact support modal with the give-feedback topic and fires analytics on click', () => {
    render(<FloatingFeedbackButton />);

    fireEvent.click(screen.getByRole('button', { name: 'Give feedback' }));

    expect(mockOnFloatingFeedbackButtonClicked).toHaveBeenCalledTimes(1);
    expect(mockOpenModal).toHaveBeenCalledWith(undefined, 'giveFeedback');
  });
});
