import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import MemberDetailsRepoCard from '@/components/page/member-details/member-details-repo-card';
import { useMemberAnalytics } from '@/analytics/members.analytics';
import { IMember, IMemberRepository } from '@/types/members.types';
import { IUserInfo } from '@/types/shared.types';

jest.mock('@/analytics/members.analytics');

const mockUseMemberAnalytics = useMemberAnalytics as jest.Mock;

describe('MemberDetailsRepoCard', () => {
  const repo: IMemberRepository = {
    name: 'Test Repo',
    url: 'https://github.com/test-repo',
    description: 'This is a test repository',
  };

  const userInfo: IUserInfo = {
    name: 'Test User',
  };

  const member: IMember = {
    id: 'member123',
    name: 'Test Member',
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

  beforeEach(() => {
    mockUseMemberAnalytics.mockReturnValue({
      onGithubProjectItemClicked: jest.fn(),
    });
  });

  it('renders the repository details correctly', () => {
    render(<MemberDetailsRepoCard repo={repo} userInfo={userInfo} memebr={member} />);

    expect(screen.getByText('Test Repo')).toBeInTheDocument();
    expect(screen.getByText('This is a test repository')).toBeInTheDocument();
  });

  it('calls analytics on link click', () => {
    const { onGithubProjectItemClicked } = useMemberAnalytics();
    render(<MemberDetailsRepoCard repo={repo} userInfo={userInfo} memebr={member} />);

    const link = screen.getByRole('link');
    fireEvent.click(link);

    expect(onGithubProjectItemClicked).toHaveBeenCalledWith(
      {
        name: member.name,
        uid: member.id,
        projectName: repo.name,
        url: repo.url,
      },
      expect.any(Object)
    );
  });

  it('opens the repository link in a new tab', () => {
    render(<MemberDetailsRepoCard repo={repo} userInfo={userInfo} memebr={member} />);

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', 'https://github.com/test-repo');

    expect(link).toHaveAttribute('target', '_blank');
  });
});
