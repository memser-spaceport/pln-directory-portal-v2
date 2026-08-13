import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';

import { NewsFeedbackButton } from '@/components/page/home/TeamNews/components/NewsFeedbackButton';
import { useContactSupportStore } from '@/services/contact-support/store';

const mockOnFeedbackButtonClicked = jest.fn();

jest.mock('@/analytics/team-news.analytics', () => ({
  useTeamNewsAnalytics: () => ({
    onFeedbackButtonClicked: (...a: unknown[]) => mockOnFeedbackButtonClicked(...a),
  }),
}));

describe('NewsFeedbackButton', () => {
  afterEach(() => {
    jest.clearAllMocks();
    // Reset the real ContactSupport store between tests — it's a shared
    // module-level singleton, same as useCurrentUserStore elsewhere in this suite.
    useContactSupportStore.getState().actions.closeModal();
  });

  it('renders the floating trigger', () => {
    render(<NewsFeedbackButton />);
    expect(screen.getByRole('button', { name: /Give feedback/ })).toBeInTheDocument();
  });

  it('opens the shared ContactSupport dialog pre-set to "Give feedback" and reports analytics', () => {
    render(<NewsFeedbackButton />);

    fireEvent.click(screen.getByRole('button', { name: /Give feedback/ }));

    expect(mockOnFeedbackButtonClicked).toHaveBeenCalledWith('home');
    const state = useContactSupportStore.getState();
    expect(state.open).toBe(true);
    expect(state.topic).toBe('Give feedback');
    expect(state.metadata).toEqual({ source: 'news-feed' });
  });
});
