import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import AllRepositories from '../../../components/page/member-details/all-repositories';

const mockRepos = [
    { name: 'Repo 1' },
    { name: 'Repo 2' },
    { name: 'Test Repo' },
];

const mockUserInfo = { name: 'User' };
const mockMember = { name: 'Member' };

describe('AllRepositories Component', () => {
    it('should render the component with repositories', () => {
        render(<AllRepositories allRepos={mockRepos} userInfo={mockUserInfo} member={mockMember} />);
        expect(screen.getByText('Repositories')).toBeInTheDocument();
        expect(screen.getByText('(3)')).toBeInTheDocument();
    });

    it('should render the component with No repository found when no repo is found', () => {
        render(<AllRepositories allRepos={[]} userInfo={mockUserInfo} member={mockMember} />);
        expect(screen.getByText('Repositories')).toBeInTheDocument();
        expect(screen.getByText('No repository found.')).toBeInTheDocument();
    });

    it('should render the component with No repository found when repos are null', () => {
        render(<AllRepositories allRepos={null} userInfo={mockUserInfo} member={mockMember} />);
        expect(screen.getByText('Repositories')).toBeInTheDocument();
        expect(screen.getByText('No repository found.')).toBeInTheDocument();
    });

    it('should filter repositories based on search term', () => {
        render(<AllRepositories allRepos={mockRepos} userInfo={mockUserInfo} member={mockMember} />);
        const searchInput = screen.getByPlaceholderText('Search');
        fireEvent.change(searchInput, { target: { value: 'Test' } });
        expect(screen.getByText('Test Repo')).toBeInTheDocument();
        expect(screen.queryByText('Repo 1')).not.toBeInTheDocument();
        expect(screen.queryByText('Repo 2')).not.toBeInTheDocument();
    });

    it('should display "No repository found." when no repositories match the search term', () => {
        render(<AllRepositories allRepos={mockRepos} userInfo={mockUserInfo} member={mockMember} />);
        const searchInput = screen.getByPlaceholderText('Search');
        fireEvent.change(searchInput, { target: { value: 'Nonexistent' } });
        expect(screen.getByText('No repository found.')).toBeInTheDocument();
    });

    it('should display all repo when search term is empty', () => {
        render(<AllRepositories allRepos={mockRepos} userInfo={mockUserInfo} member={mockMember} />);
        const searchInput = screen.getByPlaceholderText('Search');
        fireEvent.change(searchInput, { target: { value: 'Nonexistent' } });
        fireEvent.change(searchInput, { target: { value: '' } });
        expect(screen.getByText('Test Repo')).toBeInTheDocument();
        expect(screen.queryByText('Repo 1')).toBeInTheDocument();
        expect(screen.queryByText('Repo 2')).toBeInTheDocument();
    });

    it('should reset repositories when "close-member-repos-modal" event is triggered', () => {
        render(<AllRepositories allRepos={mockRepos} userInfo={mockUserInfo} member={mockMember} />);
        const event = new CustomEvent('close-member-repos-modal');
        document.dispatchEvent(event);
        expect(screen.getByText('Repo 1')).toBeInTheDocument();
        expect(screen.getByText('Repo 2')).toBeInTheDocument();
        expect(screen.getByText('Test Repo')).toBeInTheDocument();
    });
});