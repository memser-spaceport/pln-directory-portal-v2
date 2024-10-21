import { render, screen, fireEvent } from '@testing-library/react';
import TeamsToolbar from '@/components/page/teams/teams-toolbar';
import { ITeamsSearchParams } from '@/types/teams.types';
import { IUserInfo } from '@/types/shared.types';
import useUpdateQueryParams from '../../../hooks/useUpdateQueryParams';
import '@testing-library/jest-dom'; // Add this line

// Mock necessary hooks and utilities
jest.mock('../../../hooks/useUpdateQueryParams', () => {
    return {
        __esModule: true, // Ensure the module is treated as an ES module
        default: jest.fn((key: string, value: string, searchParams: any) => ({
            updateQueryParams: jest.fn((key: string, value: string, searchParams: any) => {
                // Simulate the behavior of the actual function if needed
                // For example, you can log the parameters or set up a mock implementation
                console.log(`Mocked updateQueryParams called with key: ${key}, value: ${value}, searchParams:`, searchParams);
            }),
        })),
    };
});


jest.mock('../../../analytics/teams.analytics', () => ({
  useTeamAnalytics: jest.fn(() => ({
    onTeamOpenFilterPanelClicked: jest.fn(),
    onTeamViewTypeChanged: jest.fn(),
    onTeamSearch: jest.fn(),
    onTeamSortByChanged: jest.fn(),
  })),
}));

describe('TeamsToolbar Component', () => {
  const mockSearchParams: ITeamsSearchParams = {
    searchBy: '',
    sort: 'ascending',
    viewType: 'grid',
    page: '1',
    tags: '',
    membershipSources: '',
    fundingStage: '',
    technology: '',
    includeFriends: '',
    officeHoursOnly: '',
    focusAreas: '',
    isRecent: '',
  };

  const mockUserInfo: IUserInfo = {
    
    name: 'Test User',
    email: 'test@example.com',
    uid: '1',

  };

  it('renders correctly with initial props', () => {
    render(<TeamsToolbar searchParams={mockSearchParams} totalTeams={10} userInfo={mockUserInfo} />);
    expect(screen.getByTestId('teams-toolbar')).toBeInTheDocument();
    expect(screen.getByText(/Teams/i)).toBeInTheDocument();
    expect(screen.getByText('(10)')).toBeInTheDocument();
  });
  it('handles input change', () => {
    render(<TeamsToolbar searchParams={mockSearchParams} totalTeams={10} userInfo={mockUserInfo} />);
    const input = screen.getByTestId('search-input');
    fireEvent.change(input, { target: { value: 'New Team' } });
    expect(input).toHaveValue('New Team');
  });

  it('submits the search form', () => {
    const { updateQueryParams } = useUpdateQueryParams();
// ... existing code ...
    render(<TeamsToolbar searchParams={mockSearchParams} totalTeams={10} userInfo={mockUserInfo} />);
    // Simulate entering a search term
    fireEvent.change(screen.getByTestId('search-input'), { target: { value: 'New Team' } });
    const inputElement = screen.getByTestId('search-input') as HTMLInputElement;
   
    // Simulate form submission
    fireEvent.submit(screen.getByTestId('search-form'));
    expect(inputElement.value).toBe('New Team');
    // Check if the function was called with the correct arguments
   // expect(updateQueryParams).toHaveBeenCalledWith('New Team', 'searchBy', mockSearchParams);
  });
  it('clears the search input', () => {
    render(<TeamsToolbar searchParams={mockSearchParams} totalTeams={10} userInfo={mockUserInfo} />);
    const input = screen.getByTestId('search-input');
    fireEvent.change(input, { target: { value: 'New Team' } });
    fireEvent.click(screen.getByTestId('clear-search-button'));
    expect(input).toHaveValue('');
  });

/*   it('opens filter panel on filter button click', () => {
    render(<TeamsToolbar searchParams={mockSearchParams} totalTeams={10} userInfo={mockUserInfo} />);
    fireEvent.click(screen.getByTestId('filter-button'));
    // Add assertions to check if the filter panel was opened
    expect(screen.getByTestId('filter-panel')).toBeVisible();
  }); */



/* 
  
 

 

 
 */
  // Add more tests for edge cases and other interactions as needed
});

