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

    await waitFor(() => {
      expect(screen.getByText('Select Contributing Team')).toBeInTheDocument();
      expect(screen.getByText('Team 1')).toBeInTheDocument();
      expect(screen.getByText('Team 2')).toBeInTheDocument();
    });
  });

  it('handles search functionality', async () => {
    render(<ContributingTeamPopup {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText('Team 1')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Search');
    fireEvent.change(searchInput, { target: { value: 'Team 1' } });

    await waitFor(() => {
      expect(screen.getByText('Team 1')).toBeInTheDocument();
      expect(screen.queryByText('Team 2')).not.toBeInTheDocument();
    });
  });

  it('handles team selection', async () => {
    const mockMembers = [{ id: '1', name: 'Member 1' }];
    (getMembersForProjectForm as jest.Mock).mockResolvedValue({ isError: false, data: mockMembers });

    render(<ContributingTeamPopup {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText('Team 1')).toBeInTheDocument();
    });

    const selectButton = screen.getAllByText('Select')[0];
    fireEvent.click(selectButton);

    await waitFor(() => {
      // Should move to Contributors step
      expect(getMembersForProjectForm).toHaveBeenCalledWith('1');
    });
  });

  it('handles error in fetching teams', async () => {
    (getTeamsForProject as jest.Mock).mockResolvedValue({ isError: true });

    render(<ContributingTeamPopup {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText('No Teams found')).toBeInTheDocument();
    });
  });

  it('handles error in fetching members', async () => {
    (getMembersForProjectForm as jest.Mock).mockResolvedValue({ isError: true, data: [] });

    render(<ContributingTeamPopup {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText('Team 1')).toBeInTheDocument();
    });

    const selectButton = screen.getAllByText('Select')[0];
    fireEvent.click(selectButton);

    await waitFor(() => {
      expect(getMembersForProjectForm).toHaveBeenCalled();
    });
  });

  it('cleans up event listeners on unmount', () => {
    const { unmount } = render(<ContributingTeamPopup {...mockProps} />);
    
    const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');
    
    unmount();
    
    expect(removeEventListenerSpy).toHaveBeenCalled();
  });

  it('shows "Added" for already selected teams', async () => {
    const propsWithSelectedTeam = {
      ...mockProps,
      selectedTeams: [mockTeams[0]]
    };

    render(<ContributingTeamPopup {...propsWithSelectedTeam} />);

    await waitFor(() => {
      expect(screen.getByText('Added')).toBeInTheDocument();
    });
  });
}); 