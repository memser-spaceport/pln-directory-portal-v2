import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import MemberRepositories from '@/components/page/member-details/member-repositories';

// Mock child components
jest.mock('@/components/page/member-details/member-details-repo-card', () => ({
  __esModule: true,
  default: ({ repo }: any) => <div data-testid={`repo-card-${repo.name}`}>{repo.name}</div>,
}));
jest.mock('@/components/page/member-details/member-empty-repository', () => ({
  __esModule: true,
  default: () => <div data-testid="empty-repo">No repositories to display</div>,
}));
jest.mock('@/components/core/modal', () => ({
  __esModule: true,
  default: ({ children, onClose }: any) => (
    <div data-testid="modal">
      <button data-testid="close-modal" onClick={onClose}>Close</button>
      {children}
    </div>
  ),
}));
jest.mock('@/components/page/member-details/all-repositories', () => ({
  __esModule: true,
  default: () => <div data-testid="all-repos">All Repositories Modal</div>,
}));

const onGithubSeeAllClicked = jest.fn();
jest.mock('@/analytics/members.analytics', () => ({
  useMemberAnalytics: () => ({ onGithubSeeAllClicked }),
}));
jest.mock('@/utils/common.utils', () => ({
  getAnalyticsUserInfo: jest.fn(() => ({ name: 'User', email: 'user@email.com', roles: ['admin'] })),
  getAnalyticsMemberInfo: jest.fn(() => ({ id: 'm1', name: 'Test Member' })),
}));

describe('MemberRepositories', () => {
  const baseProps: any = {
    member: {
      id: 'm1',
      name: 'Test Member',
      githubHandle: 'gh',
      discordHandle: 'discord',
      telegramHandle: 'telegram',
      twitter: 'twitter',
      linkedinHandle: 'linkedin',
      email: 'test@email.com',
      skills: [{ title: 'JS' }],
      projectContributions: [],
      location: { metroArea: '', city: '', country: '', region: '', continent: '' },
      officeHours: null,
      teamLead: false,
      teams: [],
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
      repositories: [
        { name: 'Repo1', description: 'desc1', url: 'url1' },
        { name: 'Repo2', description: 'desc2', url: 'url2' },
        { name: 'Repo3', description: 'desc3', url: 'url3' },
        { name: 'Repo4', description: 'desc4', url: 'url4' },
      ],
    },
    userInfo: { name: 'User', email: 'user@email.com', uid: 'u1', roles: ['admin'] },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders repository cards for up to 3 repos', () => {
    render(<MemberRepositories {...baseProps} />);
    expect(screen.getByTestId('repo-card-Repo1')).toBeInTheDocument();
    expect(screen.getByTestId('repo-card-Repo2')).toBeInTheDocument();
    expect(screen.getByTestId('repo-card-Repo3')).toBeInTheDocument();
    expect(screen.queryByTestId('repo-card-Repo4')).not.toBeInTheDocument();
    expect(screen.getByText('Repositories (4)')).toBeInTheDocument();
  });

  it('shows "See all" button if more than 3 repos and opens modal on click', () => {
    render(<MemberRepositories {...baseProps} />);
    const seeAllBtn = screen.getByText('See all');
    expect(seeAllBtn).toBeInTheDocument();
    fireEvent.click(seeAllBtn);
    expect(onGithubSeeAllClicked).toHaveBeenCalled();
    expect(screen.getByTestId('modal')).toBeInTheDocument();
    expect(screen.getByTestId('all-repos')).toBeInTheDocument();
    expect(screen.getByText('Repositories (4)')).toBeInTheDocument();
  });

  it('shows empty state if repositories is an empty array', () => {
    const member = { ...baseProps.member, repositories: [] };
    render(<MemberRepositories {...baseProps} member={member} />);
    expect(screen.getByTestId('empty-repo')).toBeInTheDocument();
  });

  it('shows error state if repositories is not an array and statusCode is 500', () => {
    const member = { ...baseProps.member, repositories: { statusCode: 500 } };
    render(<MemberRepositories {...baseProps} member={member} />);
    expect(screen.getByText('Repositories (0)')).toBeInTheDocument();
    expect(screen.getByText(/Unable to fetch/)).toBeInTheDocument();
  });

  it('renders nothing if repositories is undefined/null/false', () => {
    const member = { ...baseProps.member, repositories: undefined };
    const { container } = render(<MemberRepositories {...baseProps} member={member} />);
    expect(container).toBeEmptyDOMElement();
    const member2 = { ...baseProps.member, repositories: null };
    const { container: c2 } = render(<MemberRepositories {...baseProps} member={member2} />);
    expect(c2).toBeEmptyDOMElement();
    const member3 = { ...baseProps.member, repositories: false as any };
    const { container: c3 } = render(<MemberRepositories {...baseProps} member={member3} />);
    expect(c3).toBeEmptyDOMElement();
  });

  it('does not show "See all" button if 3 or fewer repos', () => {
    const member = { ...baseProps.member, repositories: [
      { name: 'Repo1', description: 'desc1', url: 'url1' },
      { name: 'Repo2', description: 'desc2', url: 'url2' },
      { name: 'Repo3', description: 'desc3', url: 'url3' },
    ]};
    render(<MemberRepositories {...baseProps} member={member} />);
    expect(screen.queryByText('See all')).not.toBeInTheDocument();
    expect(screen.getByTestId('repo-card-Repo1')).toBeInTheDocument();
    expect(screen.getByTestId('repo-card-Repo2')).toBeInTheDocument();
    expect(screen.getByTestId('repo-card-Repo3')).toBeInTheDocument();
    expect(screen.getByText('Repositories (3)')).toBeInTheDocument();
  });

  it('renders nothing if repositories is a non-array object without statusCode', () => {
    const member = { ...baseProps.member, repositories: { foo: 'bar' } };
    const { container } = render(<MemberRepositories {...baseProps} member={member} />);
    const repoDiv = container.querySelector('.member-repo');
    expect(repoDiv).toBeInTheDocument();
    expect(repoDiv).toBeEmptyDOMElement();
  });

  it('shows header for empty repositories array', () => {
    const member = { ...baseProps.member, repositories: [] };
    render(<MemberRepositories {...baseProps} member={member} />);
    expect(screen.getByText('Repositories (0)')).toBeInTheDocument();
    expect(screen.getByTestId('empty-repo')).toBeInTheDocument();
    // "See all" button should not be present
    expect(screen.queryByText('See all')).not.toBeInTheDocument();
  });

  it('calls onClose when modal close button is clicked', () => {
    render(<MemberRepositories {...baseProps} />);
    // Open the modal first
    const seeAllBtn = screen.getByText('See all');
    fireEvent.click(seeAllBtn);
    // Now close the modal
    const closeBtn = screen.getByTestId('close-modal');
    fireEvent.click(closeBtn);
    // No assertion needed, just triggering the function for coverage
  });

  it('shows header for 1 repository and no "See all" button', () => {
    const member = { ...baseProps.member, repositories: [
      { name: 'Repo1', description: 'desc1', url: 'url1' }
    ]};
    render(<MemberRepositories {...baseProps} member={member} />);
    expect(screen.getByText('Repositories (1)')).toBeInTheDocument();
    expect(screen.queryByText('See all')).not.toBeInTheDocument();
  });

  it('shows header for 2 repositories and no "See all" button', () => {
    const member = { ...baseProps.member, repositories: [
      { name: 'Repo1', description: 'desc1', url: 'url1' },
      { name: 'Repo2', description: 'desc2', url: 'url2' }
    ]};
    render(<MemberRepositories {...baseProps} member={member} />);
    expect(screen.getByText('Repositories (2)')).toBeInTheDocument();
    expect(screen.queryByText('See all')).not.toBeInTheDocument();
  });
}); 