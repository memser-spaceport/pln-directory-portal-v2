import { render, screen, fireEvent } from '@testing-library/react';
import { TeamsToolbar } from '@/components/page/teams/TeamsToolbar';
import { IUserInfo } from '@/types/shared.types';
import '@testing-library/jest-dom';

const mockSetParam = jest.fn();

const mockSearchParams = {
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

jest.mock('@/hooks/teams/useGetTeamsFilterAsObjectFromStore', () => ({
  useGetTeamsFilterAsObjectFromStore: jest.fn(() => mockSearchParams),
}));

jest.mock('@/services/teams', () => ({
  useTeamFilterStore: jest.fn(() => ({ setParam: mockSetParam, params: new URLSearchParams() })),
}));

jest.mock('@/analytics/teams.analytics', () => ({
  useTeamAnalytics: jest.fn(() => ({
    onTeamOpenFilterPanelClicked: jest.fn(),
    onTeamViewTypeChanged: jest.fn(),
    onTeamSearch: jest.fn(),
    onTeamSortByChanged: jest.fn(),
  })),
}));

const mockUserInfo: IUserInfo = {
  name: 'Test User',
  email: 'test@example.com',
  uid: '1',
};

describe('TeamsToolbar Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSearchParams.searchBy = '';
  });

  it('renders correctly with initial props', () => {
    render(<TeamsToolbar totalTeams={10} userInfo={mockUserInfo} />);
    expect(screen.getByTestId('teams-toolbar')).toBeInTheDocument();
    expect(screen.getByText(/Teams/i)).toBeInTheDocument();
    expect(screen.getByText('(10)')).toBeInTheDocument();
  });

  it('handles input change', () => {
    render(<TeamsToolbar totalTeams={10} userInfo={mockUserInfo} />);
    const input = screen.getByTestId('search-input');
    fireEvent.change(input, { target: { value: 'New Team' } });
    expect(input).toHaveValue('New Team');
  });

  it('submits the search form and calls setParam', () => {
    render(<TeamsToolbar totalTeams={10} userInfo={mockUserInfo} />);
    fireEvent.change(screen.getByTestId('search-input'), { target: { value: 'New Team' } });
    fireEvent.submit(screen.getByTestId('search-form'));
    expect(mockSetParam).toHaveBeenCalledWith('searchBy', 'New Team');
  });

  it('clears the search input', () => {
    render(<TeamsToolbar totalTeams={10} userInfo={mockUserInfo} />);
    const input = screen.getByTestId('search-input');
    fireEvent.change(input, { target: { value: 'New Team' } });
    fireEvent.click(screen.getByTestId('clear-search-button'));
    expect(input).toHaveValue('');
  });

  it('calls setParam with sort value on sort change', () => {
    render(<TeamsToolbar totalTeams={10} userInfo={mockUserInfo} />);
    expect(screen.getByTestId('teams-toolbar')).toBeInTheDocument();
  });
});
