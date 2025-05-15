import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AllTeams from '@/components/page/member-details/all-teams';

// Mock the child component
jest.mock('@/components/page/member-details/member-details-team-card', () => (props: any) => (
  <div data-testid="team-card">{props.team?.name || 'No Name'}</div>
));

const sortedTeams = [
  { id: '1', name: 'Alpha', role: 'Lead', mainTeam: true },
  { id: '2', name: 'Beta', role: 'Member', mainTeam: false },
];
const teams = [
  { id: '1', name: 'Alpha', industryTags: ['tag1'] },
  { id: '2', name: 'Beta', industryTags: ['tag2'] },
];
const baseProps = {
  teams,
  sortedTeams,
  isLoggedIn: true,
  userInfo: { id: 'u1', name: 'User' },
  member: { id: 'm1', name: 'Member' },
};

describe('AllTeams', () => {
  it('renders the teams list and count', () => {
    render(<AllTeams {...baseProps} />);
    expect(screen.getByText('Teams')).toBeInTheDocument();
    expect(screen.getByText('(2)')).toBeInTheDocument();
    expect(screen.getAllByTestId('team-card')).toHaveLength(2);
    expect(screen.getByDisplayValue('')).toBeInTheDocument();
  });

  it('renders empty state if no teams', () => {
    render(<AllTeams {...baseProps} teams={[]} sortedTeams={[]} />);
    expect(screen.getByText('No Teams found.')).toBeInTheDocument();
  });

  it('filters teams by search term', () => {
    render(<AllTeams {...baseProps} />);
    const input = screen.getByPlaceholderText('Search');
    fireEvent.change(input, { target: { value: 'Alpha' } });
    expect(screen.getAllByTestId('team-card')).toHaveLength(1);
    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.queryByText('Beta')).not.toBeInTheDocument();
  });

  it('shows all teams again when search is cleared', () => {
    render(<AllTeams {...baseProps} />);
    const input = screen.getByPlaceholderText('Search');
    fireEvent.change(input, { target: { value: 'Alpha' } });
    expect(screen.getAllByTestId('team-card')).toHaveLength(1);
    fireEvent.change(input, { target: { value: '' } });
    expect(screen.getAllByTestId('team-card')).toHaveLength(2);
  });

  it('search is case-insensitive', () => {
    render(<AllTeams {...baseProps} />);
    const input = screen.getByPlaceholderText('Search');
    fireEvent.change(input, { target: { value: 'beta' } });
    expect(screen.getAllByTestId('team-card')).toHaveLength(1);
    expect(screen.getByText('Beta')).toBeInTheDocument();
  });

  it('shows empty state if search yields no results', () => {
    render(<AllTeams {...baseProps} />);
    const input = screen.getByPlaceholderText('Search');
    fireEvent.change(input, { target: { value: 'Gamma' } });
    expect(screen.getByText('No Teams found.')).toBeInTheDocument();
  });

  it('handles mainTeam and isMainTeam props', () => {
    render(<AllTeams {...baseProps} />);
    // This just ensures the code path is hit; the mock renders a div for each team
    expect(screen.getAllByTestId('team-card')).toHaveLength(2);
  });

  it('resets teams and searchTerm on custom event', () => {
    render(<AllTeams {...baseProps} />);
    const input = screen.getByPlaceholderText('Search');
    fireEvent.change(input, { target: { value: 'Alpha' } });
    expect(screen.getAllByTestId('team-card')).toHaveLength(1);
    // Dispatch the custom event
    fireEvent(document, new Event('close-member-teams-modal'));
    // Wait for effect
    expect(screen.getAllByTestId('team-card')).toHaveLength(2);
    expect(input).toHaveValue('');
  });

  it('renders with only one team', () => {
    render(<AllTeams {...baseProps} teams={[teams[0]]} sortedTeams={[sortedTeams[0]]} />);
    expect(screen.getAllByTestId('team-card')).toHaveLength(1);
    expect(screen.getByText('Alpha')).toBeInTheDocument();
  });

  it('renders with no industryTags or role', () => {
    const customTeams = [{ id: '3', name: 'Gamma' }];
    const customSorted = [{ id: '3', name: 'Gamma' }];
    render(<AllTeams {...baseProps} teams={customTeams} sortedTeams={customSorted} />);
    expect(screen.getByText('Gamma')).toBeInTheDocument();
  });

  it('handles empty teams and sortedTeams props gracefully', () => {
    render(<AllTeams isLoggedIn={true} userInfo={{}} member={{}} teams={[]} sortedTeams={[]} />);
    // Should render Teams header and count as (0)
    expect(screen.getByText('Teams')).toBeInTheDocument();
    expect(screen.getByText('(0)')).toBeInTheDocument();
    expect(screen.getByText('No Teams found.')).toBeInTheDocument();
  });
}); 