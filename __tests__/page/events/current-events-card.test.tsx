import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import CurrentEventCard from '@/components/page/events/current-events-card';

// Mock utils
jest.mock('@/utils/irl.utils', () => ({
  getFormattedDateString: jest.fn(() => 'Jan 1, 2024'),
  formatHtml: jest.fn((desc: string) => desc),
}));

jest.mock('text-clipper', () => jest.fn((desc: string) => desc.length > 80 ? desc.slice(0, 80) : desc));

describe('CurrentEventCard', () => {
  const baseProps = {
    eventData: {
      name: 'Test Event',
      description: 'This is a test event description.',
      bannerUrl: '/banner.png',
      attendees: 10,
      location: 'Test Location',
      startDate: '2024-01-01',
      endDate: '2024-01-02',
    },
  };

  it('renders event name, description, and banner', () => {
    render(<CurrentEventCard {...baseProps} />);
    expect(screen.getByText('Test Event')).toBeInTheDocument();
    expect(screen.getByText('This is a test event description.')).toBeInTheDocument();
    expect(screen.getByAltText('Test Event event')).toHaveAttribute('src', '/banner.png');
  });

  it('clips long event name', () => {
    const longName = 'A'.repeat(50);
    render(<CurrentEventCard {...baseProps} eventData={{ ...baseProps.eventData, name: longName }} />);
    expect(screen.getByText(`${longName.slice(0, 40)}...`)).toBeInTheDocument();
  });

  it('shows formatted date', () => {
    render(<CurrentEventCard {...baseProps} />);
    expect(screen.getByText('Jan 1, 2024')).toBeInTheDocument();
  });

  it('shows attendees info if attendees > 0', () => {
    render(<CurrentEventCard {...baseProps} eventData={{ ...baseProps.eventData, attendees: 5 }} />);
    expect(screen.getByText('5 Attending')).toBeInTheDocument();
    expect(screen.getByText('👍')).toBeInTheDocument();
  });

  it('does not show attendees info if attendees is 0', () => {
    render(<CurrentEventCard {...baseProps} eventData={{ ...baseProps.eventData, attendees: 0 }} />);
    expect(screen.queryByText('0 Attending')).not.toBeInTheDocument();
    expect(screen.queryByText('👍')).not.toBeInTheDocument();
  });

  it('handles empty description', () => {
    render(<CurrentEventCard {...baseProps} eventData={{ ...baseProps.eventData, description: '' }} />);
    // Should not throw, and description div should exist (empty)
    expect(screen.getByText('', { selector: '.event-description' })).toBeInTheDocument();
  });

  it('clips long description', () => {
    const longDesc = 'A'.repeat(100);
    render(<CurrentEventCard {...baseProps} eventData={{ ...baseProps.eventData, description: longDesc }} />);
    // The mock returns the first 80 chars
    expect(screen.getByText(longDesc.slice(0, 80))).toBeInTheDocument();
  });

}); 