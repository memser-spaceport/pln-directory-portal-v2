import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import MemberProjectContributions from '../../../components/page/member-details/member-project-contributions';

describe('MemberProjectContributions', () => {
    const mockContributions = [
        { project: { name: 'Project One' } },
        { project: { name: 'Project Two' } },
        { project: { name: 'Another Project' } },
    ];

    it('renders without crashing', () => {
        render(<MemberProjectContributions contributions={mockContributions} />);
        expect(screen.getByText('Project Contributions')).toBeInTheDocument();
    });

    it('displays the correct number of contributions', () => {
        render(<MemberProjectContributions contributions={mockContributions} />);
        expect(screen.getByText('(3)')).toBeInTheDocument();
    });

    it('filters contributions based on search term', () => {
        render(<MemberProjectContributions contributions={mockContributions} />);
        const searchInput = screen.getByPlaceholderText('Search');
        fireEvent.change(searchInput, { target: { value: 'Project' } });
        expect(screen.queryAllByText('Project One')).toHaveLength(2);
        expect(screen.queryAllByText('Project Two')).toHaveLength(2);
        expect(screen.queryByText('Another Projects')).not.toBeInTheDocument();
    });

    it('displays no results message when no contributions match search term', () => {
        render(<MemberProjectContributions contributions={mockContributions} />);
        const searchInput = screen.getByPlaceholderText('Search');
        fireEvent.change(searchInput, { target: { value: 'Nonexistent' } });
        expect(screen.getByText('No repository found.')).toBeInTheDocument();
    });

    it('resets contributions and search term when close-member-projects-modal event is triggered', async () => {
        render(<MemberProjectContributions contributions={mockContributions} />);
        const searchInput = screen.getByPlaceholderText('Search');
        fireEvent.change(searchInput, { target: { value: 'Project' } });
        expect(screen.queryByText('Another Projects')).not.toBeInTheDocument();

        const event = new CustomEvent('close-member-projects-modal');
        await document.dispatchEvent(event);
        expect(screen.queryAllByText('Another Project')).toHaveLength(2);
    });

});