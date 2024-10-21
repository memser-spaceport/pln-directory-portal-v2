import { render, screen } from '@testing-library/react';
import TeamCard from '@/components/page/home/featured/team-card';
import '@testing-library/jest-dom';

describe('TeamCard Component', () => {
  const defaultProps = {
    name: 'Test Team',
    shortDescription: 'This is a short description of the test team',
    logo: '/icons/team-logo.svg',
    isNew: true,
  };

  it('renders the team name and description', () => {
    render(<TeamCard {...defaultProps} />);
    expect(screen.getByText('Test Team')).toBeInTheDocument();
    expect(screen.getByText('This is a short description of the test team')).toBeInTheDocument();
  });

  it('displays the team logo', () => {
    render(<TeamCard {...defaultProps} />);
    const logo = screen.getByAltText('team image');
    expect(logo).toHaveAttribute('src', '/icons/team-logo.svg');
  });

  it('renders the "New" badge when isNew is true', () => {
    render(<TeamCard {...defaultProps} />);
    const badge = screen.getByText('New');
    expect(badge).toBeInTheDocument();
  });

  it('uses the default team logo if no logo is provided', () => {
    const { rerender } = render(<TeamCard {...defaultProps} />);
    const logo = screen.getByAltText('team image');
    expect(logo).toHaveAttribute('src', '/icons/team-logo.svg');

    rerender(<TeamCard {...defaultProps} logo={undefined} />);
    expect(screen.getByAltText('team image')).toHaveAttribute('src', '/icons/team-default-profile.svg');
  });

  it('renders without crashing when no isNew prop is provided', () => {
    render(<TeamCard {...defaultProps} isNew={undefined} />);
    expect(screen.queryByText('New')).not.toBeInTheDocument();
  });
});
