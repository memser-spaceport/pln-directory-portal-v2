import '@testing-library/jest-dom';
import { act, fireEvent, render, screen } from '@testing-library/react';

import { GlobalFeedback } from '@/components/core/GlobalFeedback';
import { useFeedbackDrawerStore } from '@/services/feedback/store';

let mockPathname = '/members';
jest.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
}));

const mockCapture = jest.fn();
jest.mock('posthog-js/react', () => ({
  usePostHog: () => ({ capture: (...args: unknown[]) => mockCapture(...args) }),
}));

/* The button and its drawer have their own suite; here only the props the host passes count. */
jest.mock('@/components/page/ai-apps/components/FloatingFeedbackButton', () => ({
  FloatingFeedbackButton: ({
    global,
  }: {
    global: { open: boolean; showButton: boolean; onOpen: () => void; onClose: () => void; onSent: () => void };
  }) => (
    <div data-testid="fab" data-open={String(global.open)} data-show-button={String(global.showButton)}>
      <button type="button" onClick={global.onOpen}>
        Open
      </button>
      <button type="button" onClick={global.onClose}>
        Close
      </button>
      <button type="button" onClick={global.onSent}>
        Sent
      </button>
    </div>
  ),
}));

describe('GlobalFeedback', () => {
  beforeEach(() => {
    mockPathname = '/members';
    jest.clearAllMocks();
    act(() => useFeedbackDrawerStore.getState().actions.closeDrawer());
  });

  it('renders nothing for a signed-out visitor', () => {
    const { container } = render(<GlobalFeedback isLoggedIn={false} />);

    expect(container).toBeEmptyDOMElement();
  });

  it('shows the button on a page outside AI Apps', () => {
    render(<GlobalFeedback isLoggedIn />);

    expect(screen.getByTestId('fab')).toHaveAttribute('data-show-button', 'true');
    expect(screen.getByTestId('fab')).toHaveAttribute('data-open', 'false');
  });

  it('hides its button on AI Apps pages, which keep their own', () => {
    mockPathname = '/pl-infra/ai-apps/app-1';

    render(<GlobalFeedback isLoggedIn />);

    expect(screen.getByTestId('fab')).toHaveAttribute('data-show-button', 'false');
  });

  it('shows no button on a bare route, which has no site chrome', () => {
    mockPathname = '/explore-pl-network';

    render(<GlobalFeedback isLoggedIn />);

    expect(screen.getByTestId('fab')).toHaveAttribute('data-show-button', 'false');
  });

  it('opens the shared drawer and sends feedback-button-click with the page', () => {
    render(<GlobalFeedback isLoggedIn />);

    fireEvent.click(screen.getByRole('button', { name: 'Open' }));

    expect(useFeedbackDrawerStore.getState().open).toBe(true);
    expect(screen.getByTestId('fab')).toHaveAttribute('data-open', 'true');
    expect(mockCapture).toHaveBeenCalledWith(
      'feedback-button-click',
      expect.objectContaining({ source: 'floating-button', page: '/members' }),
    );

    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(useFeedbackDrawerStore.getState().open).toBe(false);
  });

  it('opens when another door (the help menu) opens the drawer', () => {
    render(<GlobalFeedback isLoggedIn />);

    act(() => useFeedbackDrawerStore.getState().actions.openDrawer());

    expect(screen.getByTestId('fab')).toHaveAttribute('data-open', 'true');
  });

  it('sends feedback-submit with the page when feedback is sent', () => {
    mockPathname = '/teams/team-1';
    render(<GlobalFeedback isLoggedIn />);

    fireEvent.click(screen.getByRole('button', { name: 'Sent' }));

    expect(mockCapture).toHaveBeenCalledWith('feedback-submit', expect.objectContaining({ page: '/teams/team-1' }));
  });
});
