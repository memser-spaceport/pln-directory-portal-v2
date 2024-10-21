import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MaintainingTeamPopup } from '@/components/page/add-edit-project/maintaining-team-popup';
import { getTeamsForProject } from '@/services/teams.service';
import { getMembersForProjectForm } from '@/services/members.service';
import '@testing-library/jest-dom';

// Mock the services
jest.mock('@/services/teams.service', () => ({
  getTeamsForProject: jest.fn(),
}));

jest.mock('@/services/members.service', () => ({
  getMembersForProjectForm: jest.fn(),
}));

jest.mock('@/utils/constants', () => ({
  EVENTS: {
    TRIGGER_REGISTER_LOADER: 'TRIGGER_REGISTER_LOADER',
    PROJECT_ADD_MODAL_CLOSE_EVENT: 'PROJECT_ADD_MODAL_CLOSE_EVENT',
  },
}));

describe('MaintainingTeamPopup Component', () => {
  const mockProps = {
    selectedMaintainingTeam: null,
    setSelectedMaintainingTeam: jest.fn(),
    onClose: jest.fn(),
    selectedContributors: [],
    setSelectedContributors: jest.fn(),
    selectedTeams: [],
  };

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
  });

  it('renders the team selection view by default', async () => {
    // Mock the response for teams
    (getTeamsForProject as jest.Mock).mockResolvedValue({
      data: [
        { uid: 'team1', name: 'Team One', logo: '/team1.png' },
        { uid: 'team2', name: 'Team Two', logo: '/team2.png' },
      ],
      isError: false,
    });

    render(<MaintainingTeamPopup {...mockProps} />);

    // Check that the team selection header is rendered
    expect(screen.getByText('Select Maintainer Team')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search')).toBeInTheDocument();

    // Wait for teams to be fetched and rendered
    await waitFor(() => expect(screen.getByText('Team One')).toBeInTheDocument());
    await waitFor(() => expect(screen.getByText('Team Two')).toBeInTheDocument());
  });

  it('filters teams based on the search input', async () => {
    // Mock the response for teams
    (getTeamsForProject as jest.Mock).mockResolvedValue({
      data: [
        { uid: 'team1', name: 'Team One', logo: '/team1.png' },
        { uid: 'team2', name: 'Team Two', logo: '/team2.png' },
      ],
      isError: false,
    });

    render(<MaintainingTeamPopup {...mockProps} />);

    // Wait for teams to load
    await waitFor(() => expect(screen.getByText('Team One')).toBeInTheDocument());

    // Perform search
    fireEvent.change(screen.getByPlaceholderText('Search'), { target: { value: 'Two' } });

    // Check if the filtered team is shown
    await waitFor(() => expect(screen.queryByText('Team One')).not.toBeInTheDocument());
    expect(screen.getByText('Team Two')).toBeInTheDocument();
  });

  it('moves to contributors step when a team is selected', async () => {
    // Mock the team service
    (getTeamsForProject as jest.Mock).mockResolvedValue({
      data: [{ uid: 'team1', name: 'Team One', logo: '/team1.png' }],
      isError: false,
    });

    // Mock the contributors service
    (getMembersForProjectForm as jest.Mock).mockResolvedValue({
      data: [
        { uid: 'member1', name: 'John Doe' },
        { uid: 'member2', name: 'Jane Doe' },
      ],
      isError: false,
    });

    render(<MaintainingTeamPopup {...mockProps} />);

    // Wait for the team to load and select it
    await waitFor(() => expect(screen.getByText('Team One')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Select'));

    // Wait for the contributors to load
    await waitFor(() => expect(screen.getByText('John Doe')).toBeInTheDocument());

    // Check if the contributors step is rendered
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
  });

  it('calls the onClose handler when saving the team', async () => {
    // Mock the team service
    (getTeamsForProject as jest.Mock).mockResolvedValue({
      data: [{ uid: 'team1', name: 'Team One', logo: '/team1.png' }],
      isError: false,
    });

    render(<MaintainingTeamPopup {...mockProps} />);

    // Wait for the team to load and select it
    await waitFor(() => expect(screen.getByText('Team One')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Select'));

    // Wait for the contributors to load
    await waitFor(() => expect(screen.getByText('John Doe')).toBeInTheDocument());

    // Trigger save click
    fireEvent.click(screen.getByText('Save'));

    // Check if onClose was called
    expect(mockProps.onClose).toHaveBeenCalled();
    expect(mockProps.setSelectedMaintainingTeam).toHaveBeenCalledWith({
      uid: 'team1',
      name: 'Team One',
      logo: '/team1.png',
    });
  });
});
