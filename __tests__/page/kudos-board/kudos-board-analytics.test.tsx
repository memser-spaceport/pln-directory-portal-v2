import '@testing-library/jest-dom';
import { render } from '@testing-library/react';

import KudosBoardComponent from '@/components/page/aligement-assets/kudos-board/kudos-board-component';

const mockPageViewed = jest.fn();

jest.mock('@/hooks/use-kudos', () => ({
  useKudosFeed: () => ({ isLoading: false, isError: false, data: { items: [] }, refetch: jest.fn() }),
  useCommunityPool: () => ({
    data: {
      pointsRemaining: 100,
      totalBudget: 100,
      pointsUsed: 0,
      eligible: true,
      pointsMin: 10,
      pointsMax: 100,
      pointsStep: 10,
      messageMin: 25,
      messageMax: 500,
    },
  }),
  useRecipients: () => ({ data: { items: [] } }),
  useGiveCommunityKudos: () => ({ mutateAsync: jest.fn(), isPending: false }),
}));
// The real hook returns a new object literal on every render, so anything
// keying off its identity re-fires. Mirror that here.
jest.mock('@/analytics/kudos.analytics', () => ({
  useKudosAnalytics: () => ({
    onKudosPageViewed: mockPageViewed,
    onGiveKudosOpened: jest.fn(),
    onCommunityKudosSubmitted: jest.fn(),
  }),
}));
jest.mock('@/utils/plaa-round.utils', () => ({ getCurrentRoundNumber: () => 5 }));
jest.mock('react-toastify', () => ({ ToastContainer: () => null }));

describe('KudosBoardComponent — page-view analytics', () => {
  beforeEach(() => jest.clearAllMocks());

  test('fires the page-view event once on mount', () => {
    render(<KudosBoardComponent />);
    expect(mockPageViewed).toHaveBeenCalledTimes(1);
  });

  test('does not re-fire when the component re-renders', () => {
    const { rerender } = render(<KudosBoardComponent />);
    rerender(<KudosBoardComponent />);
    rerender(<KudosBoardComponent />);
    expect(mockPageViewed).toHaveBeenCalledTimes(1);
  });
});
