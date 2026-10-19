import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import KudosBoardComponent from '@/components/page/aligement-assets/kudos-board/kudos-board-component';

const feedReturn: Record<string, unknown> = {};

jest.mock('@/hooks/use-kudos', () => ({
  useKudosFeed: () => feedReturn,
  useCommunityPool: () => ({ data: undefined }),
  useRecipients: () => ({ data: { items: [] } }),
  useGiveCommunityKudos: () => ({ mutateAsync: jest.fn(), isPending: false }),
  useUpdateCommunityKudos: () => ({ mutateAsync: jest.fn(), isPending: false }),
}));
jest.mock('@/analytics/kudos.analytics', () => ({
  useKudosAnalytics: () => ({
    onKudosPageViewed: jest.fn(),
    onGiveKudosOpened: jest.fn(),
    onCommunityKudosSubmitted: jest.fn(),
    onEditKudosOpened: jest.fn(),
    onCommunityKudosUpdated: jest.fn(),
  }),
}));
jest.mock('@/utils/plaa-round.utils', () => ({ getCurrentRoundNumber: () => 5 }));

describe('KudosBoardComponent before the feed loads', () => {
  it('shows the loading skeleton while the feed query is still disabled, as on the server render', () => {
    Object.assign(feedReturn, {
      isPending: true,
      isLoading: false,
      isError: false,
      data: undefined,
      refetch: jest.fn(),
    });

    const { container } = render(<KudosBoardComponent />);

    expect(screen.queryByText('No kudos on the board yet')).not.toBeInTheDocument();
    expect(container.querySelectorAll('.sk')).toHaveLength(4);
  });

  it('shows the empty state once the feed has loaded with no kudos', () => {
    Object.assign(feedReturn, {
      isPending: false,
      isLoading: false,
      isError: false,
      data: { items: [] },
      refetch: jest.fn(),
    });

    render(<KudosBoardComponent />);

    expect(screen.getByText('No kudos on the board yet')).toBeInTheDocument();
  });
});
