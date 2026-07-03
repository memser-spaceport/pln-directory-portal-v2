import { render, screen } from '@testing-library/react';
import { TeamGridView } from '@/components/page/teams/TeamList/components/TeamGridView';
import { ITeam, ITeamsSearchParams } from '@/types/teams.types';
import '@testing-library/jest-dom';

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

// team.utils.ts also pulls in next/server (for unrelated server-side helpers), which isn't
// polyfilled in the jsdom test environment — stub the two client-safe functions this view uses.
jest.mock('@/utils/team.utils', () => ({
  getTeamPriority: () => undefined,
  getPriorityLabel: () => '',
}));

const team: ITeam = { id: 'team-1', name: 'Acme', shortDescription: 'desc', isFollowed: false } as ITeam;
const searchParams = { searchBy: '' } as unknown as ITeamsSearchParams;

describe('TeamGridView follow button', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // The follow button is currently hidden on the teams page (commented out in
  // TeamGridView) — kept for both auth states until the feature is re-enabled.
  it('does not render a follow button for anonymous users', () => {
    render(<TeamGridView team={team} viewType="grid" searchParams={searchParams} isLoggedIn={false} />);
    expect(screen.queryByRole('button', { name: /follow/i })).not.toBeInTheDocument();
  });

  it('does not render a follow button for logged-in users', () => {
    render(<TeamGridView team={team} viewType="grid" searchParams={searchParams} isLoggedIn />);
    expect(screen.queryByRole('button', { name: /follow/i })).not.toBeInTheDocument();
  });
});
