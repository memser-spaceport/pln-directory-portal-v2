// __tests__/IrlCard.test.js
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import IrlCard from '@/components/page/home/featured/irl-card';

const mockProps = {
  id: '1',
  slugUrl: 'sample-event',
  name: 'Aleph Ciudad',
  description: 'This is a sample event description.',
  location: 'Sample Location',
  type: 'INVITE_ONLY',
  attendees: 10,
  startDate: '2024-12-02T07:00:00.000Z',
  endDate: '2024-12-10T07:00:00.000Z',
  bannerUrl: '/path/to/banner.jpg',
};

describe('IrlCard', () => {
  it('renders IrlCard component with given props', () => {
    render(<IrlCard {...mockProps} />);

    // Check if the name is rendered
    expect(screen.getByText('Aleph Ciudad')).toBeInTheDocument();

    // Check if the description is rendered
    expect(screen.getByText('This is a sample event description.')).toBeInTheDocument();

    // Check if the location is rendered
    expect(screen.getByText('Sample Location')).toBeInTheDocument();

    // Check if the invite-only badge is rendered
    expect(screen.getByText('Invite Only')).toBeInTheDocument();

    // Check if the attendees count is rendered
    expect(screen.getByText('Dec 1-9, 2024')).toBeInTheDocument();

    // Check if the banner image is rendered
    const bannerImg = screen.getByAltText('banner image');
    expect(bannerImg).toHaveAttribute('src', '/path/to/banner.jpg');
  });

  it('applies the long name class if the name is longer than 25 characters', () => {
    const longNameProps = { ...mockProps, name: 'This is a very long event name that exceeds 25 characters' };
    render(<IrlCard {...longNameProps} />);

    const nameElement = screen.getByText('This is a very long event name that exceeds 25 characters');
    expect(nameElement).toHaveClass('irlCard__body__name--long');
  });

  it('renders "Joined" for past events', () => {
    const pastEventProps = { ...mockProps, type:'', endDate: '2023-12-10T07:00:00.000Z' };
    render(<IrlCard {...pastEventProps} />);

    expect(screen.getByText('10 Joined')).toBeInTheDocument();
  });

  it('renders "Going" for non invite-only events', () => {
    const pastEventProps = { ...mockProps, type:'' };
    render(<IrlCard {...pastEventProps} />);

    expect(screen.getByText('10 Going')).toBeInTheDocument();
  });

  it('clamps the description to 2 lines if the name is long', () => {
    const longNameProps = { ...mockProps, name: 'This is a very long event name that exceeds 25 characters' };
    render(<IrlCard {...longNameProps} />);

    const descElement = screen.getByText('This is a sample event description.');
    expect(descElement).toHaveClass('irlCard__body__desc--short');
  });

  it('does not render the description if clippedDesc is empty', () => {
    const emptyDescProps = { ...mockProps, description: '' };
    render(<IrlCard {...emptyDescProps} />);
  
    // Expect no description to be rendered
    expect(screen.queryByText('This is a sample event description.')).toBeNull();
  });

  it('does not render the attendees badge if attendees is 0', () => {
    const noAttendeesProps = { ...mockProps, attendees: 0, type: '' };
    render(<IrlCard {...noAttendeesProps} />);
  
    // Expect no attendees badge to be rendered
    expect(screen.queryByText(/Going/)).toBeNull();
    expect(screen.queryByText(/Joined/)).toBeNull();
  });
});
