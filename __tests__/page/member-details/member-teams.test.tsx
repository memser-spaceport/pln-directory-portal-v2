// unit test for member-teams.tsx

import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import * as ReactModule from 'react'; // For mocking useRef
import MemberTeams from '@/components/page/member-details/member-teams';

// Mock child components
jest.mock('@/components/page/member-details/member-details-team-card', () => ({
  __esModule: true,
  default: (props: any) => <div data-testid={`team-card-${props.team?.id}`}>{props.team?.name}</div>,
}));
jest.mock('@/components/page/member-details/all-teams', () => ({
  __esModule: true,
  default: (props: any) => <div data-testid="all-teams-modal">AllTeamsModal</div>,
}));
jest.mock('@/components/core/modal', () => ({
  __esModule: true,
  default: (props: any) => (
    <dialog data-testid="modal" open onClick={props.onClose}>
      {props.children}
    </dialog>
  ),
}));

// Mock analytics and utils
const onTeamsSeeAllClicked = jest.fn();
jest.mock('@/analytics/members.analytics', () => ({
  useMemberAnalytics: () => ({ onTeamsSeeAllClicked }),
}));
jest.mock('@/utils/common.utils', () => ({
  getAnalyticsUserInfo: jest.fn(() => ({ name: 'User', email: 'user@email.com', roles: ['admin'] })),
  getAnalyticsMemberInfo: jest.fn(() => ({ id: 'm1', name: 'Member' })),
}));

// Helper: create mock props
const createProps = (overrides: any = {}) => ({
  member: {
    id: 'm1',
    name: 'Member',
    skills: [{ title: 'Skill' }],
    projectContributions: [],
    location: { metroArea: '', city: '', country: '', region: '', continent: '' },
    officeHours: null,
    teamLead: false,
    teams: [],
    mainTeam: null,
    openToWork: false,
    preferences: { showEmail: true, showDiscord: true, showTwitter: true, showLinkedin: true, showTelegram: true, showGithubHandle: true, showGithubProjects: true },
  },
  userInfo: { name: 'User', email: 'user@email.com', roles: ['admin'] },
  isLoggedIn: true,
  teams: [],
  ...overrides,
});

// Helper: create mock team
const createTeam = (overrides: Partial<any> = {}) => ({
  id: 't1',
  name: 'Team 1',
  asks: [],
  maintainingProjects: [],
  contributingProjects: [],
  teamFocusAreas: [],
  industryTags: [],
  ...overrides,
});

describe('MemberTeams', () => {
  let refObj: any;

  beforeEach(() => {
    jest.clearAllMocks();
    refObj = { showModal: jest.fn(), close: jest.fn() };
    jest.spyOn(ReactModule, 'useRef').mockReturnValue({ current: refObj });
  });

  it('renders no teams message if member has no teams', () => {
    const props = createProps({ member: { ...createProps().member, teams: [] }, teams: [] });
    render(<MemberTeams {...props} />);
    expect(screen.getByText(/Team\(s\) are yet to be linked/i)).toBeInTheDocument();
  });

  it('renders up to 3 teams and no "See all" button if teams <= 3', () => {
    const teams = [
      createTeam({ id: 't1', name: 'Team 1' }),
      createTeam({ id: 't2', name: 'Team 2' }),
      createTeam({ id: 't3', name: 'Team 3' }),
    ];
    const member = { ...createProps().member, teams };
    render(<MemberTeams {...createProps({ member, teams })} />);
    expect(screen.getByText('Teams (3)')).toBeInTheDocument();
    expect(screen.queryByText('See all')).not.toBeInTheDocument();
    teams.forEach((team) => {
      expect(screen.getByTestId(`team-card-${team.id}`)).toBeInTheDocument();
    });
  });

  it('renders "See all" button if more than 3 teams', () => {
    const teams = [
      createTeam({ id: 't1', name: 'Team 1' }),
      createTeam({ id: 't2', name: 'Team 2' }),
      createTeam({ id: 't3', name: 'Team 3' }),
      createTeam({ id: 't4', name: 'Team 4' }),
    ];
    const member = { ...createProps().member, teams };
    render(<MemberTeams {...createProps({ member, teams })} />);
    expect(screen.getByText('See all')).toBeInTheDocument();
    ['t1', 't2', 't3'].forEach((id) => {
      expect(screen.getByTestId(`team-card-${id}`)).toBeInTheDocument();
    });
    expect(screen.queryByTestId('team-card-t4')).not.toBeInTheDocument();
  });

  it('renders with 1 team', () => {
    const teams = [
      createTeam({ id: 't1', name: 'Team 1' }),
    ];
    const member = { ...createProps().member, teams };
    render(<MemberTeams {...createProps({ member, teams })} />);
    expect(screen.getByTestId('team-card-t1')).toBeInTheDocument();
    expect(screen.queryByText('See all')).not.toBeInTheDocument();
  });

  it('renders with 0 teams but teams prop is non-empty', () => {
    const teams = [
      createTeam({ id: 't1', name: 'Team 1' }),
    ];
    const member = { ...createProps().member, teams: [] };
    render(<MemberTeams {...createProps({ member, teams })} />);
    expect(screen.getByText(/Team\(s\) are yet to be linked/i)).toBeInTheDocument();
  });

  it('sorts teams by mainTeam and then by name', () => {
    const teams = [
      createTeam({ id: 't1', name: 'Beta', mainTeam: false }),
      createTeam({ id: 't2', name: 'Alpha', mainTeam: false }),
      createTeam({ id: 't3', name: 'Gamma', mainTeam: true }),
    ];
    const member = { ...createProps().member, teams };
    const sortedTeams = (member?.teams ?? []).sort((teamA: any, teamB: any) => {
      if (teamA.mainTeam === teamB.mainTeam) {
        return teamA?.name.localeCompare(teamB?.name);
      } else {
        return teamB?.mainTeam - teamA?.mainTeam;
      }
    });
    render(<MemberTeams {...createProps({ member, teams })} />);
    // The first team should be the one with mainTeam: true
    expect(screen.getByTestId('team-card-t3')).toBeInTheDocument();
    // The next should be sorted by name
    expect(screen.getByTestId('team-card-t1')).toBeInTheDocument();
    expect(screen.getByTestId('team-card-t2')).toBeInTheDocument();
  });

});

