import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

const mockCount = jest.fn<number | undefined, []>(() => undefined);

// See team-news-count-chip.test.tsx: the global useQuery stub ignores `select`,
// so an unmocked useTeamNewsCount returns a truthy object here.
jest.mock('@/services/team-news/hooks/useTeamNewsCounts', () => ({
  useTeamNewsCount: () => mockCount(),
}));

jest.mock('@/analytics/team-news.analytics', () => ({
  useTeamNewsAnalytics: () => ({
    onTeamNewsCountChipClicked: jest.fn(),
    onTeamNewsCountChipShown: jest.fn(),
  }),
}));

jest.mock('@/services/follow/hooks/useToggleTeamFollowInList', () => ({
  useToggleTeamFollowInList: jest.fn(() => ({ toggleFollow: jest.fn(), isPending: false })),
}));

jest.mock('@/hooks/use-embla-carousel', () => ({
  useCarousel: () => ({
    emblaRef: jest.fn(),
    activeIndex: 0,
    scrollPrev: jest.fn(),
    scrollNext: jest.fn(),
    setActiveIndex: jest.fn(),
    emblaApi: null,
  }),
}));

jest.mock('@/analytics/teams.analytics', () => ({
  useTeamAnalytics: () => ({
    onCarouselButtonClicked: jest.fn(),
    onCarouselPrevButtonClicked: jest.fn(),
    onCarouselNextButtonClicked: jest.fn(),
  }),
}));

// team.utils.ts pulls in next/server, which jsdom doesn't polyfill.
jest.mock('@/utils/team.utils', () => ({
  getTeamPriority: () => undefined,
  getPriorityLabel: () => '',
}));

import { TeamGridView } from '@/components/page/teams/TeamList/components/TeamGridView';
import { ITeam, ITeamsSearchParams } from '@/types/teams.types';

const team: ITeam = { id: 'team-1', name: 'Acme', shortDescription: 'desc', isFollowed: false } as ITeam;
const searchParams = { searchBy: '' } as unknown as ITeamsSearchParams;

describe('TeamGridView news chip', () => {
  const onOpenTeamNews = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockCount.mockReturnValue(3);
  });

  it('shows the chip when the card is wired to open news', () => {
    render(<TeamGridView team={team} viewType="GRID" searchParams={searchParams} onOpenTeamNews={onOpenTeamNews} />);
    expect(screen.getByRole('button', { name: /3 new posts/i })).toBeInTheDocument();
  });

  it('shows no chip when the surface has not wired one up', () => {
    render(<TeamGridView team={team} viewType="GRID" searchParams={searchParams} />);
    expect(screen.queryByRole('button', { name: /new posts?/i })).not.toBeInTheDocument();
  });

  it('hands over team.id — which IS the backend teamUid on this listing', async () => {
    render(<TeamGridView team={team} viewType="GRID" searchParams={searchParams} onOpenTeamNews={onOpenTeamNews} />);

    await userEvent.click(screen.getByRole('button', { name: /3 new posts/i }));

    // getTeamList maps `id: team.uid` and its projection carries no `uid` field
    // at all, so reaching for `team.uid` here would send `undefined` to an
    // endpoint keyed by team uid — and every chip would silently go blank.
    expect(onOpenTeamNews).toHaveBeenCalledWith('team-1', 'Acme');
  });

  it('renders no chip for a team with no id to count against', () => {
    render(
      <TeamGridView
        team={{ ...team, id: undefined } as unknown as ITeam}
        viewType="GRID"
        searchParams={searchParams}
        onOpenTeamNews={onOpenTeamNews}
      />,
    );
    expect(screen.queryByRole('button', { name: /new posts?/i })).not.toBeInTheDocument();
  });
});
