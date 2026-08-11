import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import { AppFeedbackButton } from '@/components/core/AppFeedbackButton';

const mockOpenModal = jest.fn();
const mockOnAppFeedbackButtonClicked = jest.fn();
const mockUsePathname = jest.fn();

jest.mock('next/navigation', () => ({
  usePathname: () => mockUsePathname(),
}));

jest.mock('@/services/contact-support/store', () => ({
  useContactSupportStore: (selector: (state: unknown) => unknown) =>
    selector({ actions: { openModal: mockOpenModal } }),
}));

jest.mock('@/analytics/common.analytics', () => ({
  useCommonAnalytics: () => ({ onAppFeedbackButtonClicked: mockOnAppFeedbackButtonClicked }),
}));

describe('AppFeedbackButton', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders the floating feedback trigger on a regular route', () => {
    mockUsePathname.mockReturnValue('/members');

    render(<AppFeedbackButton />);

    expect(screen.getByRole('button', { name: 'Feedback' })).toBeInTheDocument();
  });

  it('opens the contact-support modal on the "giveFeedback" topic and reports analytics on click', () => {
    mockUsePathname.mockReturnValue('/members');

    render(<AppFeedbackButton />);

    fireEvent.click(screen.getByRole('button', { name: 'Feedback' }));

    expect(mockOnAppFeedbackButtonClicked).toHaveBeenCalledWith('/members');
    expect(mockOpenModal).toHaveBeenCalledWith(undefined, 'giveFeedback');
  });

  it('renders nothing on routes that already ship their own dedicated feedback entry point', () => {
    mockUsePathname.mockReturnValue('/pl-infra/ai-apps/some-app');

    const { container } = render(<AppFeedbackButton />);

    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing on bare routes with no site chrome', () => {
    mockUsePathname.mockReturnValue('/pl-infra/ai-apps/some-app/prd');

    const { container } = render(<AppFeedbackButton />);

    expect(container).toBeEmptyDOMElement();
  });
});
