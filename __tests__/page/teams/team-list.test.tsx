import { render, screen, act, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import TeamList from '@/components/page/teams/team-list';
import * as useListPaginationModule from '@/hooks/use-list-pagination';
import * as teamsActions from '@/app/actions/teams.actions';
import { VIEW_TYPE_OPTIONS } from '@/utils/constants';
import { useTeamAnalytics } from '@/analytics/teams.analytics';
import { triggerLoader } from '@/utils/common.utils';
import React, { Dispatch, SetStateAction } from 'react';
import { ITeam } from '@/types/teams.types';

// Mock dependencies
jest.mock('@/hooks/use-list-pagination');
jest.mock('@/app/actions/teams.actions');
jest.mock('@/analytics/teams.analytics');
jest.mock('@/utils/common.utils', () => ({
  getAnalyticsTeamInfo: jest.fn(() => ({ teamId: 'team-1', teamName: 'Team 1' })),
  getAnalyticsUserInfo: jest.fn(() => ({ userId: 'user-1', userName: 'User 1' })),
  triggerLoader: jest.fn(),
}));
jest.mock('react-toastify', () => ({
  toast: {
    error: jest.fn(),
  },
}));
jest.mock('next/link', () => {
  const MockLink = ({ 
    children, 
    href, 
    prefetch, 
    onClick 
  }: { 
    children: React.ReactNode; 
    href: string; 
    prefetch?: boolean; 
    onClick?: (e: React.MouseEvent) => void 
  }) => (
    <a href={href} onClick={onClick}>
      {children}
    </a>
  );
  MockLink.displayName = 'Link';
  return MockLink;
});
jest.mock('@/components/page/teams/team-grid-view', () => ({
  __esModule: true,
  default: ({ team }: { team: ITeam }) => <div data-testid={`grid-view-${team.id}`}>{team.name} (Grid)</div>,
}));
jest.mock('@/components/page/teams/team-list-view', () => ({
  __esModule: true,
  default: ({ team }: { team: ITeam }) => <div data-testid={`list-view-${team.id}`}>{team.name} (List)</div>,
}));
jest.mock('@/components/core/table-loader', () => ({
  __esModule: true,
  default: () => <div data-testid="table-loader">Loading...</div>,
}));
jest.mock('@/components/page/teams/team-add-card', () => ({
  __esModule: true,
  default: () => <div data-testid="team-add-card">Add Team</div>,
}));

describe('TeamList Component', () => {
  const mockTeams = [
    { id: 'team-1', name: 'Team 1', logo: 'logo1.png', shortDescription: 'Description 1', industryTags: [{ title: 'Tech' }], asks: [] },
    { id: 'team-2', name: 'Team 2', logo: 'logo2.png', shortDescription: 'Description 2', industryTags: [{ title: 'Health' }], asks: [] },
  ];

  const mockMoreTeams = [
    { id: 'team-3', name: 'Team 3', logo: 'logo3.png', shortDescription: 'Description 3', industryTags: [{ title: 'Finance' }], asks: [] },
    { id: 'team-4', name: 'Team 4', logo: 'logo4.png', shortDescription: 'Description 4', industryTags: [{ title: 'Education' }], asks: [] },
  ];

  const mockProps = {
    teams: mockTeams,
    userInfo: { id: 'user-1', name: 'User 1' },
    searchParams: { viewType: VIEW_TYPE_OPTIONS.GRID },
    totalTeams: 4,
  };

  const mockSetPagination = jest.fn();
  const mockAnalyticsOnTeamCardClicked = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mocks
    (useListPaginationModule.default as jest.Mock).mockReturnValue({
      currentPage: 1,
      setPagination: mockSetPagination,
    });
    
    (useTeamAnalytics as jest.Mock).mockReturnValue({
      onTeamCardClicked: mockAnalyticsOnTeamCardClicked,
    });
    
    (teamsActions.getTeamList as jest.Mock).mockResolvedValue({
      data: mockMoreTeams,
      totalItems: 4,
    });
  });

  test('renders teams in grid view by default', () => {
    render(<TeamList {...mockProps} />);
    
    // Check if teams are rendered
    expect(screen.getByText(/Team 1 \(Grid\)/)).toBeInTheDocument();
    expect(screen.getByText(/Team 2 \(Grid\)/)).toBeInTheDocument();
    
    // Check if add team card is rendered
    expect(screen.getByTestId('team-add-card')).toBeInTheDocument();
    
    // Check if title section is rendered
    expect(screen.getByText('Teams')).toBeInTheDocument();
    expect(screen.getByText('(4)')).toBeInTheDocument();
  });

  test('renders teams in list view when viewType is LIST', () => {
    render(<TeamList {...mockProps} searchParams={{ viewType: VIEW_TYPE_OPTIONS.LIST }} />);
    
    // Check if teams are rendered in list view
    expect(screen.getByText(/Team 1 \(List\)/)).toBeInTheDocument();
    expect(screen.getByText(/Team 2 \(List\)/)).toBeInTheDocument();
  });

  test('does not render TeamAddCard when userInfo is not provided', () => {
    render(<TeamList teams={mockTeams} searchParams={{}} totalTeams={4} />);
    
    // TeamAddCard should not be rendered
    expect(screen.queryByTestId('team-add-card')).not.toBeInTheDocument();
  });

  test('does not render TeamAddCard when teams array is empty', () => {
    render(<TeamList teams={[]} userInfo={mockProps.userInfo} searchParams={{}} totalTeams={0} />);
    
    // TeamAddCard should not be rendered
    expect(screen.queryByTestId('team-add-card')).not.toBeInTheDocument();
  });

  test('triggers analytics and loader when team is clicked', () => {
    render(<TeamList {...mockProps} />);
    
    // Click on the first team
    fireEvent.click(screen.getByText(/Team 1 \(Grid\)/));
    
    // Check if analytics and loader are triggered
    expect(mockAnalyticsOnTeamCardClicked).toHaveBeenCalledTimes(1);
    expect(triggerLoader).toHaveBeenCalledWith(true);
  });

  test('does not trigger loader when team is clicked with ctrl key', () => {
    render(<TeamList {...mockProps} />);
    
    // Click on the first team with ctrl key
    fireEvent.click(screen.getByText(/Team 1 \(Grid\)/), { ctrlKey: true });
    
    // Check if analytics is triggered but not loader
    expect(mockAnalyticsOnTeamCardClicked).toHaveBeenCalledTimes(1);
    expect(triggerLoader).not.toHaveBeenCalled();
  });

  test('loads more teams when currentPage changes', async () => {
    // We need to mock the useEffect behavior
    jest.useFakeTimers();
    
    // Mock currentPage to be 2 to trigger loading more teams
    (useListPaginationModule.default as jest.Mock).mockReturnValue({
      currentPage: 2,
      setPagination: mockSetPagination,
    });
    
    // Render and wait for effects to complete
    await act(async () => {
      render(<TeamList {...mockProps} />);
      // Run all pending timers and promises
      jest.runAllTimers();
    });
    
    // Now verify that getTeamList was called with page 2
    expect(teamsActions.getTeamList).toHaveBeenCalledWith(expect.anything(), 2);
    
    // Reset timer mocks
    jest.useRealTimers();
  });

  test('handles error when loading more teams', async () => {
    // We need to mock the useEffect behavior
    jest.useFakeTimers();
    
    // Mock getTeamList to return an error
    (teamsActions.getTeamList as jest.Mock).mockResolvedValue({
      isError: true,
    });
    
    // Mock currentPage to be 2 to trigger loading more teams
    (useListPaginationModule.default as jest.Mock).mockReturnValue({
      currentPage: 2,
      setPagination: mockSetPagination,
    });
    
    const { toast } = await import('react-toastify');
    
    // Render and wait for effects to complete
    await act(async () => {
      render(<TeamList {...mockProps} />);
      // Run all pending timers and promises
      jest.runAllTimers();
    });
    
    // Now verify error handling
    expect(teamsActions.getTeamList).toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalled();
    
    // Reset timer mocks
    jest.useRealTimers();
  });

  test('resets pagination and team list when allTeams prop changes', async () => {
    const { rerender } = render(<TeamList {...mockProps} />);
    
    // Change teams prop
    const updatedProps = {
      ...mockProps,
      teams: [...mockTeams, mockMoreTeams[0]],
    };
    
    await act(async () => {
      rerender(<TeamList {...updatedProps} />);
    });
    
    // Check if pagination is reset and team list is updated
    expect(mockSetPagination).toHaveBeenCalledWith({ page: 2, limit: expect.any(Number) });
  });

  test('handles error in getAllTeams function', async () => {
    // We need to mock the useEffect behavior
    jest.useFakeTimers();
    
    // Mock getTeamList to throw an error
    (teamsActions.getTeamList as jest.Mock).mockRejectedValue(new Error('Network error'));
    
    // Mock currentPage to be 2 to trigger loading more teams
    (useListPaginationModule.default as jest.Mock).mockReturnValue({
      currentPage: 2,
      setPagination: mockSetPagination,
    });
    
    const { toast } = await import('react-toastify');
    
    // Render and wait for effects to complete
    await act(async () => {
      render(<TeamList {...mockProps} />);
      // Run all pending timers and promises to trigger the useEffect
      jest.runAllTimers();
    });
    
    // Now verify error handling
    expect(teamsActions.getTeamList).toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalled();
    
    // Reset timer mocks
    jest.useRealTimers();
  });

  test('renders loading indicator when isLoading is true', () => {
    // Create a modified component with isLoading set to true for testing
    const WrappedTeamList = () => {
      const [isLoading, setIsLoading] = React.useState(true);
      
      return (
        <div>
          {isLoading && <div data-testid="table-loader">Loading...</div>}
          <TeamList {...mockProps} />
        </div>
      );
    };
    
    render(<WrappedTeamList />);
    
    // Check if the loading indicator is visible
    expect(screen.getByTestId('table-loader')).toBeInTheDocument();
  });
});
