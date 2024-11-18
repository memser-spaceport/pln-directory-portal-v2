import React from 'react';
import { render, fireEvent, screen, act } from '@testing-library/react';
import TeamsInvolved from '@/components/page/project-details/teams-involved';
import { useProjectAnalytics } from '@/analytics/project.analytics';
import '@testing-library/jest-dom';
import { EVENTS } from '@/utils/constants';
import { url } from 'inspector';
jest.mock('@/analytics/project.analytics');

const mockUseProjectAnalytics = useProjectAnalytics as jest.Mock;

describe('TeamsInvolved Component', () => {
  const project = {
    id: '1',
    contributingTeams: [
      { uid: 'team1', name: 'Team 1', logo: { url: '/team1-logo.png' } },
      { uid: 'team2', name: 'Team 2', logo: { url: '/team2-logo.png' } },
      { uid: 'team3', name: 'Team 3', logo: { url: '/team3-logo.png' } },
      { uid: 'team4', name: 'Team 4', logo: { url: null } },
    ],
    maintainingTeam: { uid: 'maintainingTeam', name: 'Maintaining Team', logo: { url: '/maintaining-team-logo.png' } },
  };

  const user = { id: 'user1', name: 'User 1', email: 'test@yopmail.com', roles: ['user'] };

  beforeEach(() => {
    mockUseProjectAnalytics.mockReturnValue({
      onProjectDetailContributingTeamClicked: jest.fn(),
      onProjectDetailMaintainerTeamClicked: jest.fn(),
      onProjectDetailSeeAllTeamsClicked: jest.fn(),
    });
  });

  it('should render the component', async () => {
    render(<TeamsInvolved project={project} user={user} />);
    expect(screen.getByText('Teams')).toBeInTheDocument();
    expect(screen.getByTitle('Maintainer')).toBeInTheDocument();
    expect(screen.queryAllByText('Team 1').length).toBeGreaterThan(0);
    expect(screen.queryAllByText('Team 2').length).toBeGreaterThan(0);
    expect(screen.queryAllByText('Team 3').length).toBeGreaterThan(0);
    expect(screen.queryAllByText('+1 more').length).toBeGreaterThan(0);
  });

  it('should handle maintainer team click', () => {
      render(<TeamsInvolved project={project} user={user} />);
      const maintainerTeamButton = screen.getByTitle('Maintainer').closest('button');
      if(maintainerTeamButton){
          fireEvent.click(maintainerTeamButton);
          expect(mockUseProjectAnalytics().onProjectDetailMaintainerTeamClicked).toHaveBeenCalled();
      }
  });

  it('should handle contributing team click', () => {
      render(<TeamsInvolved project={project} user={user} />);
      const contributingTeamButton = screen.queryAllByText('Team 1')[0].closest('button');
      if(contributingTeamButton){
          fireEvent.click(contributingTeamButton);
          expect(mockUseProjectAnalytics().onProjectDetailContributingTeamClicked).toHaveBeenCalled();
      }
  });

  it('should handle see all teams click', () => {
      const { getByText } = render(<TeamsInvolved project={project} user={user} />);
      const seeAllTeamsButton = getByText('Teams').closest('button');
      if(seeAllTeamsButton){
          fireEvent.click(seeAllTeamsButton);
          expect(mockUseProjectAnalytics().onProjectDetailSeeAllTeamsClicked).toHaveBeenCalled();
      }
  });
});
