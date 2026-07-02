import { render, screen, fireEvent } from '@testing-library/react';
import { TeamGridView } from '@/components/page/teams/TeamList/components/TeamGridView';
import { ITeam, ITeamsSearchParams } from '@/types/teams.types';
import '@testing-library/jest-dom';

const mockToggleFollow = jest.fn();

jest.mock('@/services/follow/hooks/useToggleTeamFollowInList', () => ({
  useToggleTeamFollowInList: jest.fn(() => ({ toggleFollow: mockToggleFollow, isPending: false })),
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

  it('does not render a follow button for anonymous users', () => {
    render(<TeamGridView team={team} viewType="grid" searchParams={searchParams} isLoggedIn={false} />);
    expect(screen.queryByRole('button', { name: /follow/i })).not.toBeInTheDocument();
  });

  it('renders a follow button for logged-in users', () => {
    render(<TeamGridView team={team} viewType="grid" searchParams={searchParams} isLoggedIn />);
    expect(screen.getByRole('button', { name: `Follow ${team.name}` })).toBeInTheDocument();
  });

  it('toggles follow without navigating the wrapping link', () => {
    render(<TeamGridView team={team} viewType="grid" searchParams={searchParams} isLoggedIn />);
    const button = screen.getByRole('button', { name: `Follow ${team.name}` });
    const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
    const preventDefaultSpy = jest.spyOn(clickEvent, 'preventDefault');

    fireEvent(button, clickEvent);

    expect(preventDefaultSpy).toHaveBeenCalled();
    expect(mockToggleFollow).toHaveBeenCalledTimes(1);
  });

  it('shows "Following" state and disables the button while a mutation is pending', () => {
    const { useToggleTeamFollowInList } = require('@/services/follow/hooks/useToggleTeamFollowInList');
    (useToggleTeamFollowInList as jest.Mock).mockReturnValueOnce({ toggleFollow: mockToggleFollow, isPending: true });

    render(
      <TeamGridView
        team={{ ...team, isFollowed: true }}
        viewType="grid"
        searchParams={searchParams}
        isLoggedIn
      />,
    );

    const button = screen.getByRole('button', { name: `Following ${team.name}` });
    expect(button).toBeDisabled();
  });
});
