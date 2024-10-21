import { render, screen } from '@testing-library/react';
import ProjectCard from '@/components/page/home/featured/project-card';
import '@testing-library/jest-dom';

describe('ProjectCard Component', () => {
  const defaultProps = {
    name: 'Test Project',
    description: 'This is a test project',
    contributors: [
      { id: 1, logo: '/icons/contributor1.svg' },
      { id: 2, logo: '/icons/contributor2.svg' },
      { id: 3, logo: '/icons/contributor3.svg' },
    ],
    logo: '/icons/project-logo.svg',
    isNew: true,
  };

  it('renders the project name and description', () => {
    render(<ProjectCard {...defaultProps} />);
    expect(screen.getByText('Test Project')).toBeInTheDocument();
    expect(screen.getByText('This is a test project')).toBeInTheDocument();
  });

  it('displays the project logo', () => {
    render(<ProjectCard {...defaultProps} />);
    const logo = screen.getByAltText('project logo');
    expect(logo).toHaveAttribute('src', '/icons/project-logo.svg');
  });

  it('renders the "New" badge when isNew is true', () => {
    render(<ProjectCard {...defaultProps} />);
    const badge = screen.getByText('New');
    expect(badge).toBeInTheDocument();
  });

  it('renders up to two contributors and displays the remaining count if more than two', () => {
    render(<ProjectCard {...defaultProps} />);
    const avatars = screen.getAllByTitle('Contributor');
    expect(avatars.length).toBe(2); // Only the first 2 contributors are shown
    const moreContributors = screen.getByText('+1');
    expect(moreContributors).toBeInTheDocument(); // +1 indicates there's 1 more contributor
  });

  it('uses the default project logo if no logo is provided', () => {
    const { rerender } = render(<ProjectCard {...defaultProps} />);
    const logo = screen.getByAltText('project logo');
    expect(logo).toHaveAttribute('src', '/icons/project-logo.svg');

    rerender(<ProjectCard {...defaultProps} logo={undefined} />);
    expect(screen.getByAltText('project logo')).toHaveAttribute('src', '/icons/project-default.svg');
  });
});
