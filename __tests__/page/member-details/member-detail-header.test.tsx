// Unit tests for MemberDetailHeader component

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import MemberDetailHeader from '@/components/page/member-details/member-detail-header';
import { ADMIN_ROLE } from '@/utils/constants';

// Shared analytics mock
const analyticsMock = {
  onMemberEditBySelf: jest.fn(),
  onMemberEditByAdmin: jest.fn(),
};
// Mocks
jest.mock('@/analytics/members.analytics', () => ({
  useMemberAnalytics: () => analyticsMock,
}));
jest.mock('@/hooks/useDefaultAvatar', () => ({
  useDefaultAvatar: (name: string) => `/default-avatar/${name}`,
}));
jest.mock('@/utils/member.utils', () => ({
  parseMemberLocation: (location: any) => location ? location.city || 'Test City' : 'Not provided',
}));
jest.mock('@/utils/common.utils', () => ({
  getAnalyticsMemberInfo: (member: any) => ({ id: member.id, name: member.name }),
  getAnalyticsUserInfo: (user: any) => ({ name: user.name, email: user.email, roles: user.roles }),
  triggerLoader: jest.fn(),
}));
jest.mock('next/navigation', () => ({ useRouter: () => ({}) }));
jest.mock('next/link', () => ({ __esModule: true, default: ({ children }: any) => <>{children}</> }));
jest.mock('@/components/core/tooltip/tooltip', () => ({ Tooltip: ({ children, trigger, content }: any) => <>{trigger}{content && <span data-testid="tooltip-content">{content}</span>}</> }));
jest.mock('@/components/ui/tag', () => ({ Tag: ({ value }: any) => <span data-testid="tag">{value}</span> }));

const baseMember = {
  id: '1',
  name: 'John Doe',
  profile: null,
  skills: [{ title: 'React' }, { title: 'Node' }, { title: 'GraphQL' }, { title: 'TypeScript' }],
  teamLead: false,
  openToWork: false,
  teams: [
    { id: 't1', name: 'Team One', role: 'Developer', teamLead: false, mainTeam: true },
    { id: 't2', name: 'Team Two', role: 'Designer', teamLead: false, mainTeam: false },
  ],
  mainTeam: { id: 't1', name: 'Team One', role: 'Developer', teamLead: false, mainTeam: true },
  location: { city: 'Test City', country: 'Test Country' },
  officeHours: null,
  email: 'john@example.com',
  githubHandle: null,
  discordHandle: null,
  telegramHandle: null,
  twitter: null,
  linkedinHandle: null,
  repositories: [],
  preferences: {},
  projectContributions: [],
};
const baseUserInfo = {
  uid: '1',
  name: 'John Doe',
  email: 'john@example.com',
  roles: [ADMIN_ROLE],
};

describe('MemberDetailHeader', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders member name, avatar, and main team', () => {
    render(
      <MemberDetailHeader member={baseMember as any} userInfo={baseUserInfo} isLoggedIn={true} />
    );
    expect(screen.getByRole('heading', { name: 'John Doe' })).toBeInTheDocument();
    expect(screen.getByAltText('project image')).toHaveAttribute('src', '/default-avatar/John Doe');
    expect(screen.getByText('Team One', { selector: 'p' })).toBeInTheDocument();
  });

  it('renders location if logged in', () => {
    render(
      <MemberDetailHeader member={baseMember as any} userInfo={baseUserInfo} isLoggedIn={true} />
    );
    expect(screen.getByText('Test City')).toBeInTheDocument();
  });

  it('does not render location if not logged in', () => {
    render(
      <MemberDetailHeader member={baseMember as any} userInfo={baseUserInfo} isLoggedIn={false} />
    );
    expect(screen.queryByText('Test City')).not.toBeInTheDocument();
  });

  it('renders edit button for owner', () => {
    render(
      <MemberDetailHeader member={baseMember as any} userInfo={{ ...baseUserInfo, roles: [] }} isLoggedIn={true} />
    );
    const link = screen.getByRole('link');
    expect(link.textContent).toMatch(/edit/i);
  });

  it('renders edit button for admin (not owner)', () => {
    const adminUser = { ...baseUserInfo, uid: '2', roles: [ADMIN_ROLE] };
    render(
      <MemberDetailHeader member={baseMember as any} userInfo={adminUser} isLoggedIn={true} />
    );
    const link = screen.getByRole('link');
    expect(link.textContent).toMatch(/edit/i);
  });

  it('does not render edit button for non-admin, non-owner', () => {
    const user = { ...baseUserInfo, uid: '2', roles: [] };
    render(
      <MemberDetailHeader member={baseMember as any} userInfo={user} isLoggedIn={true} />
    );
    expect(screen.queryByText(/Edit/)).not.toBeInTheDocument();
  });

  it('calls analytics on edit click for owner', () => {
    render(
      <MemberDetailHeader member={baseMember as any} userInfo={{ ...baseUserInfo, roles: [] }} isLoggedIn={true} />
    );
    const link = screen.getByRole('link');
    fireEvent.click(link);
    expect(analyticsMock.onMemberEditBySelf).toHaveBeenCalled();
  });

  it('calls analytics on edit click for admin', () => {
    const adminUser = { ...baseUserInfo, uid: '2', roles: [ADMIN_ROLE] };
    render(
      <MemberDetailHeader member={baseMember as any} userInfo={adminUser} isLoggedIn={true} />
    );
    const link = screen.getByRole('link');
    fireEvent.click(link);
    expect(analyticsMock.onMemberEditByAdmin).toHaveBeenCalled();
  });

  it('renders open to work tag', () => {
    render(
      <MemberDetailHeader member={{ ...(baseMember as any), openToWork: true }} userInfo={baseUserInfo} isLoggedIn={true} />
    );
    expect(screen.getByText('Open to Collaborate')).toBeInTheDocument();
  });

  it('renders team lead tag', () => {
    render(
      <MemberDetailHeader member={{ ...(baseMember as any), teamLead: true }} userInfo={baseUserInfo} isLoggedIn={true} />
    );
    expect(screen.getByText('Team lead')).toBeInTheDocument();
  });

  it('renders up to 3 skill tags and a +N tag for more', () => {
    render(
      <MemberDetailHeader member={baseMember as any} userInfo={baseUserInfo} isLoggedIn={true} />
    );
    // Only the first 3 skill tags should be visible (not the +N tag)
    const skillTags = screen.getAllByTestId('tag').filter(tag => !tag.textContent?.startsWith('+'));
    expect(skillTags.length).toBe(3);
    // +N tag for skills
    const plusTag = screen.getAllByTestId('tag').find(tag => tag.textContent === '+1');
    expect(plusTag).toBeTruthy();
  });

  it('renders all skill tags if 3 or fewer', () => {
    const member = { ...(baseMember as any), skills: [{ title: 'React' }, { title: 'Node' }, { title: 'GraphQL' }] };
    render(
      <MemberDetailHeader member={member} userInfo={baseUserInfo} isLoggedIn={true} />
    );
    expect(screen.getAllByTestId('tag').length).toBe(3);
    expect(screen.queryByText('+')).not.toBeInTheDocument();
  });

  it('renders no skills gracefully', () => {
    const member = { ...(baseMember as any), skills: [] };
    render(
      <MemberDetailHeader member={member} userInfo={baseUserInfo} isLoggedIn={true} />
    );
    expect(screen.queryByTestId('tag')).not.toBeInTheDocument();
  });

  it('renders no teams gracefully', () => {
    const member = { ...(baseMember as any), teams: [], mainTeam: null };
    render(
      <MemberDetailHeader member={member} userInfo={baseUserInfo} isLoggedIn={true} />
    );
    // Should not throw, and should not render team name
    expect(screen.queryByText('Team One')).not.toBeInTheDocument();
  });

  it('renders with no profile image', () => {
    const member = { ...(baseMember as any), profile: null };
    render(
      <MemberDetailHeader member={member} userInfo={baseUserInfo} isLoggedIn={true} />
    );
    expect(screen.getByAltText('project image')).toHaveAttribute('src', '/default-avatar/John Doe');
  });

  it('calls triggerLoader(false) on mount', () => {
    const { triggerLoader } = require('@/utils/common.utils');
    render(
      <MemberDetailHeader member={baseMember as any} userInfo={baseUserInfo} isLoggedIn={true} />
    );
    expect(triggerLoader).toHaveBeenCalledWith(false);
  });

  it('renders tooltips for name, team, and role', () => {
    render(
      <MemberDetailHeader member={baseMember as any} userInfo={baseUserInfo} isLoggedIn={true} />
    );
    // Name tooltip
    expect(screen.getAllByTestId('tooltip-content').some(el => el.textContent === 'John Doe')).toBe(true);
    // Team tooltip
    expect(screen.getAllByTestId('tooltip-content').some(el => el.textContent === 'Team One')).toBe(true);
    // Role tooltip
    expect(screen.getAllByTestId('tooltip-content').some(el => el.textContent === 'Developer')).toBe(true);
  });

  it('renders and shows tooltip for extra teams', () => {
    // member with 3 teams
    const member = {
      ...baseMember,
      teams: [
        { id: 't1', name: 'Team One', role: 'Developer', teamLead: false, mainTeam: true },
        { id: 't2', name: 'Team Two', role: 'Designer', teamLead: false, mainTeam: false },
        { id: 't3', name: 'Team Three', role: 'Tester', teamLead: false, mainTeam: false },
      ],
      mainTeam: { id: 't1', name: 'Team One', role: 'Developer', teamLead: false, mainTeam: true },
    };
    render(<MemberDetailHeader member={member as any} userInfo={baseUserInfo} isLoggedIn={true} />);
    // Find the "+2" button and click it (simulate tooltip trigger)
    const plusButton = screen.getByRole('button', { name: '+2' });
    fireEvent.click(plusButton);
    // Assert that the tooltip content for 'Team Two' and 'Team Three' is present
    const tooltipContents = screen.getAllByTestId('tooltip-content');
    expect(tooltipContents.some(el => el.textContent?.includes('Team Two'))).toBe(true);
    expect(tooltipContents.some(el => el.textContent?.includes('Team Three'))).toBe(true);
  });

  it('renders and shows tooltip for extra skills', () => {
    // member with 5 skills
    const member = {
      ...baseMember,
      skills: [
        { title: 'React' },
        { title: 'Node' },
        { title: 'GraphQL' },
        { title: 'TypeScript' },
        { title: 'Jest' },
      ],
    };
    render(<MemberDetailHeader member={member as any} userInfo={baseUserInfo} isLoggedIn={true} />);
    // Find the "+2" skill tag and click it (simulate tooltip trigger)
    const plusSkillTag = screen.getAllByTestId('tag').find(tag => tag.textContent === '+2');
    expect(plusSkillTag).toBeInTheDocument();
    fireEvent.click(plusSkillTag!);
    // Assert that the tooltip content for 'TypeScript' and 'Jest' is present
    const tooltipContents = screen.getAllByTestId('tooltip-content');
    expect(tooltipContents.some(el => el.textContent?.includes('TypeScript'))).toBe(true);
    expect(tooltipContents.some(el => el.textContent?.includes('Jest'))).toBe(true);
  });

  it('renders gracefully when member name is missing', () => {
    const member = { ...baseMember, name: undefined };
    render(<MemberDetailHeader member={member as any} userInfo={baseUserInfo} isLoggedIn={true} />);
    // Should render an empty name (h1 should be present but empty)
    expect(screen.getByRole('heading')).toBeInTheDocument();
    expect(screen.getByRole('heading').textContent).toBe('');
  });

  it('renders only main team name and no "+N" button when member has one team', () => {
    const member = {
      ...baseMember,
      teams: [
        { id: 't1', name: 'Team One', role: 'Developer', teamLead: false, mainTeam: true },
      ],
      mainTeam: { id: 't1', name: 'Team One', role: 'Developer', teamLead: false, mainTeam: true },
    };
    render(<MemberDetailHeader member={member as any} userInfo={baseUserInfo} isLoggedIn={true} />);
    expect(screen.getByText('Team One', { selector: 'p' })).toBeInTheDocument();
    // Should not render any "+N" button
    expect(screen.queryByRole('button', { name: /^\+\d+$/ })).not.toBeInTheDocument();
  });

  it('does not render teams section if member.teams[0].name is falsy', () => {
    const member = { ...baseMember, teams: [{ id: 't1', name: '', role: 'Developer', teamLead: false, mainTeam: true }], mainTeam: null };
    render(<MemberDetailHeader member={member as any} userInfo={baseUserInfo} isLoggedIn={true} />);
    // Should not render the teams section
    expect(screen.queryByText('Team One')).not.toBeInTheDocument();
  });
});
