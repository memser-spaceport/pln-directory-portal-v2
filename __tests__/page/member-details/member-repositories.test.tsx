import { render, screen, fireEvent } from '@testing-library/react';
import MemberRepositories from '@/components/page/member-details/member-repositories';
import '@testing-library/jest-dom';
import { IUserInfo } from '@/types/shared.types';
import { IMember } from '@/types/members.types';

let mockMember: IMember = {
  id: '1',
  name: 'John Doe',
  repositories: [
    { id: 'repo1', name: 'Repository 1' },
    { id: 'repo2', name: 'Repository 2' },
    { id: 'repo3', name: 'Repository 3' },
    { id: 'repo4', name: 'Repository 4' },
  ],
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

const mockUserInfo: IUserInfo = {
  name: 'Jane Doe',
};

HTMLDialogElement.prototype.showModal = jest.fn();
HTMLDialogElement.prototype.close = jest.fn();

describe('MemberRepositories', () => {
  it('renders without crashing', () => {
    render(<MemberRepositories member={mockMember} userInfo={mockUserInfo} />);
    expect(screen.getByText('Repositories (4)')).toBeInTheDocument();
  });

  it('displays the correct number of repositories', () => {
    render(<MemberRepositories member={mockMember} userInfo={mockUserInfo} />);
    expect(screen.getByText('Repositories (4)')).toBeInTheDocument();
  });

  it('shows "See all" button when there are more than 3 repositories', () => {
    render(<MemberRepositories member={mockMember} userInfo={mockUserInfo} />);
    expect(screen.getByText('See all')).toBeInTheDocument();
  });

  it('opens modal with all repositories when "See all" button is clicked', async () => {
    render(<MemberRepositories member={mockMember} userInfo={mockUserInfo} />);
    await fireEvent.click(screen.getByText('See all'));
    expect(screen.getByText('Repository 4')).toBeInTheDocument();
  });

  it('displays empty repository message when there are no repositories', () => {
    const emptyMember = { ...mockMember, repositories: [] };
    render(<MemberRepositories member={emptyMember} userInfo={mockUserInfo} />);
    expect(screen.getByText('No repository found.')).toBeInTheDocument();
  });

  it('closes modal when onClose is called', () => {
    const { container } = render(<MemberRepositories member={mockMember} userInfo={mockUserInfo} />);
    fireEvent.click(screen.getByText('See all'));
    const clsbtn = container.querySelector('img[src="/icons/close.svg"]');
    clsbtn && fireEvent.click(clsbtn);
    expect(screen.queryByText('See all')).toBeInTheDocument();
  });

  it('render without any error when the repositories is null', () => {
    mockMember = { ...mockMember, repositories: null };
    render(<MemberRepositories member={mockMember} userInfo={mockUserInfo} />);
    expect(screen.queryByText('Repositories')).not.toBeInTheDocument();
  });

});
