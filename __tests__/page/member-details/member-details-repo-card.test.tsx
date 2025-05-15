import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import MemberDetailsRepoCard from '@/components/page/member-details/member-details-repo-card';

// Mock analytics and utils
const onGithubProjectItemClicked = jest.fn();
jest.mock('@/analytics/members.analytics', () => ({
  useMemberAnalytics: () => ({ onGithubProjectItemClicked }),
}));
jest.mock('@/utils/common.utils', () => ({
  getAnalyticsUserInfo: jest.fn(() => ({ name: 'User', email: 'user@email.com', roles: ['admin'] })),
}));

describe('MemberDetailsRepoCard', () => {
  const repo = {
    name: 'Test Repo',
    description: 'A test repository',
    url: 'https://github.com/test/repo',
  };
  const userInfo = {
    name: 'User',
    email: 'user@email.com',
    uid: 'u1',
    roles: ['admin'],
  };
  const member = {
    id: 'm1',
    name: 'Test Member',
    skills: [{ title: 'JS' }] as [{ title: string }],
    projectContributions: [] as [],
    location: {
      metroArea: '',
      city: '',
      country: '',
      region: '',
      continent: '',
    },
    officeHours: null,
    teamLead: false,
    teams: [] as any[],
    mainTeam: null,
    openToWork: false,
    preferences: {
      showEmail: true,
      showDiscord: true,
      showTwitter: true,
      showLinkedin: true,
      showTelegram: true,
      showGithubHandle: true,
      showGithubProjects: true,
    },
  } as const;

  it('renders repository name, description, and go-to button', () => {
    render(<MemberDetailsRepoCard repo={repo} userInfo={userInfo} memebr={member} />);
    expect(screen.getByText('Test Repo')).toBeInTheDocument();
    expect(screen.getByText('A test repository')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /go-to/i })).toBeInTheDocument();
    expect(screen.getByRole('link')).toHaveAttribute('href', repo.url);
  });

  it('shows dash if description is missing', () => {
    // @ts-expect-error: testing missing description
    render(<MemberDetailsRepoCard repo={{ ...repo, description: undefined }} userInfo={userInfo} memebr={member} />);
    expect(screen.getByText('-')).toBeInTheDocument();
  });

  it('calls analytics on card click', () => {
    render(<MemberDetailsRepoCard repo={repo} userInfo={userInfo} memebr={member} />);
    const link = screen.getByRole('link');
    fireEvent.click(link);
    expect(onGithubProjectItemClicked).toHaveBeenCalledWith(
      expect.objectContaining({
        name: member.name,
        uid: member.id,
        projectName: repo.name,
        url: repo.url,
      }),
      expect.any(Object)
    );
  });
});

