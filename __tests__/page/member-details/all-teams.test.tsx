import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import AllTeams from '../../../components/page/member-details/all-teams';

const mockTeams = [
    { id: 1, name: 'Team A', role: 'Developer', mainTeam: true, industryTags: ['Tech'] },
    { id: 2, name: 'Team B', role: 'Designer', mainTeam: false, industryTags: ['Design'] },
];

const mockSortedTeams = [
    { id: 1, name: 'Team A', role: 'Developer', mainTeam: true },
    { id: 2, name: 'Team B', role: 'Designer', mainTeam: false },
];

const mockUserInfo = { id: 1, name: 'User' };
const mockMember = { id: 1, name: 'Member' };

describe('AllTeams Component', () => {
    it('should render the component with teams', () => {
        render(
            <AllTeams
                teams={mockTeams}
                isLoggedIn={true}
                sortedTeams={mockSortedTeams}
                userInfo={mockUserInfo}
                member={mockMember}
            />
        );

        expect(screen.getByText('Teams')).toBeInTheDocument();
        expect(screen.getByText('(2)')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Search')).toBeInTheDocument();
        expect(screen.getByText('Team A')).toBeInTheDocument();
        expect(screen.getByText('Team B')).toBeInTheDocument();
    });

    it('should render the component with teams', () => {
        render(
            <AllTeams
                teams={null}
                isLoggedIn={true}
                sortedTeams={[]}
                userInfo={mockUserInfo}
                member={mockMember}
            />
        );

        expect(screen.getByText('No Teams found.')).toBeInTheDocument();
    });

    it('should filter teams based on search input', () => {
        render(
            <AllTeams
                teams={mockTeams}
                isLoggedIn={true}
                sortedTeams={mockSortedTeams}
                userInfo={mockUserInfo}
                member={mockMember}
            />
        );

        const searchInput = screen.getByPlaceholderText('Search');
        fireEvent.change(searchInput, { target: { value: 'Team A' } });

        expect(screen.getByText('Team A')).toBeInTheDocument();
        expect(screen.queryByText('Team B')).not.toBeInTheDocument();
    });

    it('should display "No Teams found." when no teams match the search input', () => {
        render(
            <AllTeams
                teams={mockTeams}
                isLoggedIn={true}
                sortedTeams={mockSortedTeams}
                userInfo={mockUserInfo}
                member={mockMember}
            />
        );

        const searchInput = screen.getByPlaceholderText('Search');
        fireEvent.change(searchInput, { target: { value: 'Nonexistent Team' } });

        expect(screen.getByText('No Teams found.')).toBeInTheDocument();
    });

    it('should reset search input and teams list when "close-member-teams-modal" event is triggered', () => {
        render(
            <AllTeams
                teams={mockTeams}
                isLoggedIn={true}
                sortedTeams={mockSortedTeams}
                userInfo={mockUserInfo}
                member={mockMember}
            />
        );


        const event = new CustomEvent('close-member-teams-modal');
        document.dispatchEvent(event);

        expect(screen.getByText('Team A')).toBeInTheDocument();
        expect(screen.getByText('Team B')).toBeInTheDocument();
    });
});