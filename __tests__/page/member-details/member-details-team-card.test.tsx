import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import MemberDetailsTeamCard from '@/components/page/member-details/member-details-team-card';
import { ITag, ITeam } from '@/types/teams.types';
import { IUserInfo } from '@/types/shared.types';
import { IMember } from '@/types/members.types';

const mockAnalytics = {
  onTeamClicked: jest.fn(),
};

jest.mock('@/analytics/members.analytics', () => ({
  useMemberAnalytics: () => mockAnalytics,
}));

jest.mock('@/utils/common.utils', () => ({
  getAnalyticsUserInfo: jest.fn(() => ({ id: '1', name: 'User A' })),
  getAnalyticsMemberInfo: jest.fn(() => ({ id: '1', name: 'Member A' })),
  getAnalyticsTeamInfo: jest.fn(() => ({ id: '1', name: 'Team A' })),
}));

const team: ITeam = {
  id: '1',
  name: 'Team A',
  logo: '/icons/team-a-logo.svg',
  maintainingProjects: [],
  contributingProjects: [],
  teamFocusAreas: [],
};

const userInfo: IUserInfo = {
  name: 'User A',
};

const member: IMember = {
  id: '1',
  name: 'Member A',
  profile: '/profile.jpg',
  mainTeam: { role: 'Developer', name: 'Team A' },
  location: {
    city: '',
    country: '',
    metroArea: '',
    region: '',
    continent: '',
  },
  teamLead: true,
  openToWork: true,
  skills: [{ title: 'JavaScript' }],
  teams: [
    {
      role: 'Developer',
      name: 'Team A',
      id: '1',
      maintainingProjects: [],
      contributingProjects: [],
      teamFocusAreas: [],
    },
  ],
  officeHours: null,
  projectContributions: [],
  githubHandle: 'githubUser',
  discordHandle: 'discordUser',
  telegramHandle: 'telegramUser',
  twitter: 'twitterUser',
  linkedinHandle: 'linkedinUser',
  email: 'email@example.com',
  preferences: {
    showEmail: true,
    showDiscord: true,
    showTwitter: true,
    showLinkedin: true,
    showTelegram: true,
    showGithubHandle: true,
    showGithubProjects: true,
  },
};

const tags: ITag[] = [{ title: 'Tag1' }, { title: 'Tag2' }, { title: 'Tag3' }];

describe('MemberDetailsTeamCard', () => {
  it('renders team card with correct details', () => {
    render(<MemberDetailsTeamCard team={team} isLoggedIn={true} role="Developer" tags={tags} isMainTeam={true} url="http://example.com" userInfo={userInfo} member={member} />);

    expect(screen.getByAltText('profile')).toHaveAttribute('src', '/icons/team-a-logo.svg');
    expect(screen.getByText('Team A')).toBeInTheDocument();
    expect(screen.getByText('Developer')).toBeInTheDocument();
    expect(screen.getAllByText('Tag1')).toHaveLength(2);
    expect(screen.getAllByText('Tag2')).toHaveLength(2);
    expect(screen.getAllByText('+1')).toHaveLength(2);
  });

  it('calls analytics on team click', () => {
    render(<MemberDetailsTeamCard team={team} isLoggedIn={true} role="Developer" tags={tags} isMainTeam={true} url="http://example.com" userInfo={userInfo} member={member} />);

    fireEvent.click(screen.getByRole('link'));

    expect(mockAnalytics.onTeamClicked).toHaveBeenCalledWith(
      expect.objectContaining({ id: '1', name: 'User A' }),
      expect.objectContaining({ id: '1', name: 'Member A' }),
      expect.objectContaining({ id: '1', name: 'Team A' })
    );
  });

  it('renders default logo when team logo is not provided', () => {
    render(<MemberDetailsTeamCard team={{ ...team, logo: undefined }} isLoggedIn={true} role="Developer" tags={tags} isMainTeam={true} url="http://example.com" userInfo={userInfo} member={member} />);

    expect(screen.getByAltText('profile')).toHaveAttribute('src', '/icons/team-default-profile.svg');
  });

  it('renders main team badge when isMainTeam is true', () => {
    render(<MemberDetailsTeamCard team={team} isLoggedIn={true} role="Developer" tags={tags} isMainTeam={true} url="http://example.com" userInfo={userInfo} member={member} />);

    expect(screen.queryAllByAltText('Main Team')).toHaveLength(2);
  });

  it('does not render main team badge when isMainTeam is false', () => {
    render(<MemberDetailsTeamCard team={team} isLoggedIn={true} role="Developer" tags={tags} isMainTeam={false} url="http://example.com" userInfo={userInfo} member={member} />);

    expect(screen.queryByAltText('Main Team')).not.toBeInTheDocument();
  });

  it('should render the component properly when the tags are undefined', () => {
    render(<MemberDetailsTeamCard team={team} isLoggedIn={true} role="Developer" tags={undefined} isMainTeam={false} url="http://example.com" userInfo={userInfo} member={member} />);

    expect(screen.queryByAltText('Main Team')).not.toBeInTheDocument();
  });
  it('should render the component properly when the tags are more than the noOfTagsToShow', () => {
    const tags: ITag[] = [{ title: 'Tag1' }, { title: 'Tag2' }, { title: 'Tag3' }, { title: 'Tag4' }];
    render(<MemberDetailsTeamCard team={team} isLoggedIn={true} role="Developer" tags={tags} isMainTeam={false} url="http://example.com" userInfo={userInfo} member={member} isPopupOpen={true} />);
    expect(screen.getAllByText('Tag1')).toHaveLength(2);
    expect(screen.getAllByText('Tag2')).toHaveLength(2);
    expect(screen.getAllByText('Tag3')).toHaveLength(2);
    expect(screen.getAllByText('Tag4')).toHaveLength(2);
  });
});
