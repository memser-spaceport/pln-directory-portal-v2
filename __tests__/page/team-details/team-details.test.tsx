import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import TeamDetails from '../../../components/page/team-details/team-details';
import { ADMIN_ROLE } from '../../../utils/constants';

// Mocks for child components and utilities
jest.mock('next/image', () => (props: any) => <img {...props} />);
jest.mock('next/navigation', () => ({ useParams: () => ({ id: 'team-1' }), useRouter: () => ({ push: jest.fn() }) }));
jest.mock('@/components/core/tooltip/tooltip', () => ({ Tooltip: (props: any) => <div>{props.trigger}{props.content}</div> }));
jest.mock('@/components/ui/tag', () => ({ Tag: (props: any) => <span>{props.value}</span> }));
const onEditTeamByAdmin = jest.fn();
const onEditTeamByLead = jest.fn();

jest.mock('@/analytics/teams.analytics', () => ({
  useTeamAnalytics: () => ({
    onEditTeamByAdmin,
    onEditTeamByLead,
  }),
}));
jest.mock('@/utils/common.utils', () => ({ getAnalyticsTeamInfo: jest.fn(() => ({})), getAnalyticsUserInfo: jest.fn(() => ({})), triggerLoader: jest.fn() }));
jest.mock('../../../components/page/team-details/about', () => (props: any) => <div data-testid="about-section">AboutSection</div>);
jest.mock('../../../components/page/team-details/technologies', () => (props: any) => <div data-testid="technologies-section">TechnologiesSection</div>);

const baseTeam = {
  id: 'team-1',
  logo: '/logo.png',
  name: 'Test Team',
  industryTags: [
    { title: 'Tag1' },
    { title: 'Tag2' },
    { title: 'Tag3' },
    { title: 'Tag4' },
    { title: 'Tag5' },
    { title: 'Tag6' },
  ],
  longDescription: 'A long description',
  technologies: [
    { title: 'React' },
    { title: 'Node' },
  ],
};
const baseUser = {
  roles: [],
  leadingTeams: [],
};

beforeEach(() => {
  onEditTeamByAdmin.mockClear();
  onEditTeamByLead.mockClear();
});

describe('TeamDetails', () => {
  it('renders team name, logo, and about/technologies sections', () => {
    render(<TeamDetails team={baseTeam as any} userInfo={baseUser as any} />);
    expect(screen.getByAltText('team-profile')).toBeInTheDocument();
    expect(screen.getAllByText('Test Team').length).toBeGreaterThan(0);
    expect(screen.getByTestId('about-section')).toBeInTheDocument();
    expect(screen.getByTestId('technologies-section')).toBeInTheDocument();
  });

  it('renders tags (mobile and web) and tag popover for >3 and >5 tags', () => {
    render(<TeamDetails team={baseTeam as any} userInfo={baseUser as any} />);
    // First 3 tags (mobile)
    expect(screen.getAllByText('Tag1')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Tag2')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Tag3')[0]).toBeInTheDocument();
    // Tag count popover (mobile)
    expect(screen.getAllByText('+3')[0]).toBeInTheDocument();
    // First 5 tags (web)
    expect(screen.getAllByText('Tag5')[0]).toBeInTheDocument();
    // Tag count popover (web)
    expect(screen.getAllByText('+1')[0]).toBeInTheDocument();
  });

  it('renders default logo and name if missing', () => {
    render(<TeamDetails team={{} as any} userInfo={baseUser as any} />);
    expect(screen.getByAltText('team-profile')).toHaveAttribute('src', '/icons/team-default-profile.svg');
    // Find the heading by class or role and check that it's empty
    const heading = document.querySelector('.team-details__profile__logo-tags-container__name-tagcontainer__team-name');
    expect(heading).toBeInTheDocument();
    expect(heading).toBeEmptyDOMElement();
  });

  it('renders edit button for admin', () => {
    const user = { ...baseUser, roles: [ADMIN_ROLE] };
    render(<TeamDetails team={baseTeam as any} userInfo={user as any} />);
    expect(screen.getByText('Edit Team')).toBeInTheDocument();
  });

  it('renders edit button for team lead', () => {
    const user = { ...baseUser, leadingTeams: ['team-1'] };
    render(<TeamDetails team={baseTeam as any} userInfo={user as any} />);
    expect(screen.getByText('Edit Team')).toBeInTheDocument();
  });

  it('does not render edit button for non-admin/non-lead', () => {
    render(<TeamDetails team={baseTeam as any} userInfo={baseUser as any} />);
    expect(screen.queryByText('Edit Team')).not.toBeInTheDocument();
  });

  it('edit button triggers analytics and navigation for admin', () => {
    const push = jest.fn();
    const user = { ...baseUser, roles: [ADMIN_ROLE] };
    jest.spyOn(require('next/navigation'), 'useRouter').mockReturnValue({ push });
    render(<TeamDetails team={baseTeam as any} userInfo={user as any} />);
    fireEvent.click(screen.getByText('Edit Team'));
    expect(onEditTeamByAdmin).toHaveBeenCalled();
    expect(push).toHaveBeenCalledWith('/settings/teams?id=team-1');
  });

  it('edit button triggers analytics and navigation for lead (not admin)', () => {
    const push = jest.fn();
    const user = { ...baseUser, leadingTeams: ['team-1'] }; // no ADMIN_ROLE in roles
    jest.spyOn(require('next/navigation'), 'useRouter').mockReturnValue({ push });
    render(<TeamDetails team={baseTeam as any} userInfo={user as any} />);
    fireEvent.click(screen.getByText('Edit Team'));
    expect(onEditTeamByLead).toHaveBeenCalled();
    expect(push).toHaveBeenCalledWith('/settings/teams?id=team-1');
  });

  it('getHasTeamEditAccess returns false on error', () => {
    // Simulate userInfo as undefined
    render(<TeamDetails team={baseTeam as any} userInfo={undefined} />);
    expect(screen.queryByText('Edit Team')).not.toBeInTheDocument();
  });

  it('getHasTeamEditAccess returns false if exception is thrown', () => {
    // Create a userInfo object that throws when accessing roles
    const userInfo = {};
    Object.defineProperty(userInfo, 'roles', {
      get: () => { throw new Error('Test error'); }
    });
    render(<TeamDetails team={baseTeam as any} userInfo={userInfo as any} />);
    // The edit button should not be rendered
    expect(screen.queryByText('Edit Team')).not.toBeInTheDocument();
  });

  it('getHasTeamEditAccess returns false if exception is thrown (leadingTeams)', () => {
    // roles is undefined, so it will try to access leadingTeams, which throws
    const userInfo = {};
    Object.defineProperty(userInfo, 'roles', { get: () => undefined });
    Object.defineProperty(userInfo, 'leadingTeams', { get: () => { throw new Error('Test error'); } });
    render(<TeamDetails team={baseTeam as any} userInfo={userInfo as any} />);
    // The edit button should not be rendered
    expect(screen.queryByText('Edit Team')).not.toBeInTheDocument();
  });

  it('triggers loader off on mount', () => {
    const { triggerLoader } = require('@/utils/common.utils');
    render(<TeamDetails team={baseTeam as any} userInfo={baseUser as any} />);
    expect(triggerLoader).toHaveBeenCalledWith(false);
  });
});