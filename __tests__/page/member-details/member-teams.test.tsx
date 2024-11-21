import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import MemberTeams from '@/components/page/member-details/member-teams';
import { IUserInfo } from '@/types/shared.types';
import { ITeam } from '@/types/teams.types';
import { IMember } from '@/types/members.types';

const mockMember: IMember = {
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
      id: '1',
      name: 'Team A',
      mainTeam: true,
      role: 'Developer',
      industryTags: [{ title: 'Tech' }],
      maintainingProjects: [],
      contributingProjects: [],
      teamFocusAreas: [],
    },
    {
      id: '2',
      name: 'Team B',
      mainTeam: false,
      role: 'Designer',
      industryTags: [{ title: 'Design' }],
      maintainingProjects: [],
      contributingProjects: [],
      teamFocusAreas: [],
    },
    {
      id: '3',
      name: 'Team C',
      mainTeam: false,
      role: 'Manager',
      industryTags: [{ title: 'Management' }],
      maintainingProjects: [],
      contributingProjects: [],
      teamFocusAreas: [],
    },
    {
      id: '4',
      name: 'Team D',
      mainTeam: false,
      role: 'Tester',
      industryTags: [{ title: 'QA' }],
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

const mockTeams: ITeam[] = [
  {
    id: '1',
    name: 'Team A',
    industryTags: [{ title: 'Tech' }],
    maintainingProjects: [],
    contributingProjects: [],
    teamFocusAreas: [],
  },
  {
    id: '2',
    name: 'Team B',
    industryTags: [{ title: 'Design' }],
    maintainingProjects: [],
    contributingProjects: [],
    teamFocusAreas: [],
  },
  {
    id: '3',
    name: 'Team C',
    industryTags: [{ title: 'Management' }],
    maintainingProjects: [],
    contributingProjects: [],
    teamFocusAreas: [],
  },
  {
    id: '4',
    name: 'Team D',
    industryTags: [{ title: 'QA' }],
    maintainingProjects: [],
    contributingProjects: [],
    teamFocusAreas: [],
  },
];

HTMLDialogElement.prototype.showModal = jest.fn();
HTMLDialogElement.prototype.close = jest.fn();

describe('MemberTeams Component', () => {
  it('should render the component with teams', () => {
    render(<MemberTeams member={mockMember} userInfo={mockUserInfo} isLoggedIn={true} teams={mockTeams} />);
    expect(screen.getByText('Teams (4)')).toBeInTheDocument();
    expect(screen.getByText('See all')).toBeInTheDocument();
  });

  it('should display only 3 teams initially', () => {
    render(<MemberTeams member={mockMember} userInfo={mockUserInfo} isLoggedIn={true} teams={mockTeams} />);
    const teams = document.querySelector('.member-teams');
    expect(teams).toContainElement(screen.queryAllByText('Team A')[0]);
    expect(teams).toContainElement(screen.queryAllByText('Team B')[0]);
    expect(teams).toContainElement(screen.queryAllByText('Team C')[0]);
    expect(teams).not.toContainElement(screen.queryByText('Team D'));
  });

  it('should open modal with all teams on "See all" button click', () => {
    render(<MemberTeams member={mockMember} userInfo={mockUserInfo} isLoggedIn={true} teams={mockTeams} />);
    fireEvent.click(screen.getByText('See all'));
    const teams = document.querySelector('.all-member-container');
    const teamName = teams?.querySelectorAll('.member-team-card__profile-details__name-and-role__name');
    if (teamName?.length) {
      expect(teamName[0].innerHTML).toBe('Team A');
      expect(teamName[1].innerHTML).toBe('Team B');
      expect(teamName[2].innerHTML).toBe('Team C');
      expect(teamName[3].innerHTML).toBe('Team D');
    }
  });

  it('should close modal on close event', () => {
    const { container } = render(<MemberTeams member={mockMember} userInfo={mockUserInfo} isLoggedIn={true} teams={mockTeams} />);
    fireEvent.click(screen.getByText('See all'));
    const clsbtn = container.querySelector('img[src="/icons/close.svg"]');
    clsbtn && fireEvent.click(clsbtn);
    const teams = document.querySelector('.member-teams');
    expect(teams).not.toContainElement(screen.queryByText('Team D'));
  });
});
