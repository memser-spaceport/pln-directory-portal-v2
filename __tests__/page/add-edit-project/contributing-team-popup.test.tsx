import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ContributingTeamPopup } from '@/components/page/add-edit-project/contributing-team-popup';
import { getTeamsForProject } from '@/services/teams.service';
import { getMembersForProjectForm } from '@/services/members.service';
import { EVENTS } from '@/utils/constants';

// Mock the services
jest.mock('@/services/teams.service', () => ({
  getTeamsForProject: jest.fn()
}));

jest.mock('@/services/members.service', () => ({
  getMembersForProjectForm: jest.fn()
}));

describe('ContributingTeamPopup', () => {
  const mockProps = {
    onClose: jest.fn(),
    selectedTeams: [],
    selectedContributingTeams: [],
    setSelectedContributingTeams: jest.fn(),
    selectedContributors: [],
    setSelectedContributors: jest.fn()
  };

  const mockTeams = [
    { uid: '1', name: 'Team 1', logo: '/team1.png' },
    { uid: '2', name: 'Team 2', logo: '/team2.png' }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (getTeamsForProject as jest.Mock).mockResolvedValue({ isError: false, data: mockTeams });
  });

  it('renders the component with initial teams list', async () => {
    render(<ContributingTeamPopup {...mockProps} />);

    
  });

}); 