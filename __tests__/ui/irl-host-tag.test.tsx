import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock Popover to just render its trigger and content for isolation
jest.mock('@/components/page/irl/attendee-list/attendee-popover', () => ({
  Tooltip: ({ trigger, content }: any) => (
    <>
      {trigger}
      {content}
    </>
  ),
}));

import IrlHostTag from '@/components/ui/irl-host-tag';

describe('IrlHostTag', () => {
  const baseEvents = [
    { name: 'Event 1', link: 'https://event1.com' },
    { name: 'Event 2', link: '' },
    { name: '', link: 'https://event3.com' },
    { name: undefined, link: undefined },
  ];
  const onHostEventClick = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the Host button', () => {
    render(<IrlHostTag hostEvents={baseEvents} onHostEventClick={onHostEventClick} />);
    expect(screen.getByRole('button', { name: /host/i })).toBeInTheDocument();
    expect(screen.getByText('Host')).toBeInTheDocument();
  });

  it('renders all host events in the popover content', () => {
    render(<IrlHostTag hostEvents={baseEvents} onHostEventClick={onHostEventClick} />);
    expect(screen.getByText('Event 1')).toBeInTheDocument();
    expect(screen.getByText('Event 2')).toBeInTheDocument();
    expect(screen.getByText('Link3')).toBeInTheDocument(); // fallback name
    expect(screen.getByText('Link4')).toBeInTheDocument(); // fallback name
  });

  it('renders links for events with a link and spans for those without', () => {
    render(<IrlHostTag hostEvents={baseEvents} onHostEventClick={onHostEventClick} />);
    // Event 1 is a link
    const link1 = screen.getByText('Event 1').closest('a');
    expect(link1).toHaveAttribute('href', 'https://event1.com');
    // Event 2 is a span
    const span2 = screen.getByText('Event 2').closest('span');
    expect(span2).toBeInTheDocument();
    // Link3 is a link
    const link3 = screen.getByText('Link3').closest('a');
    expect(link3).toHaveAttribute('href', 'https://event3.com');
    // Link4 is a span
    const span4 = screen.getByText('Link4').closest('span');
    expect(span4).toBeInTheDocument();
  });

  it('calls onHostEventClick when a link event is clicked', () => {
    render(<IrlHostTag hostEvents={baseEvents} onHostEventClick={onHostEventClick} />);
    const link1 = screen.getByText('Event 1').closest('a');
    fireEvent.click(link1!);
    expect(onHostEventClick).toHaveBeenCalledWith(baseEvents[0]);
    const link3 = screen.getByText('Link3').closest('a');
    fireEvent.click(link3!);
    expect(onHostEventClick).toHaveBeenCalledWith(baseEvents[2]);
  });

  it('does not call onHostEventClick for span events', () => {
    render(<IrlHostTag hostEvents={baseEvents} onHostEventClick={onHostEventClick} />);
    const span2 = screen.getByText('Event 2').closest('span');
    fireEvent.click(span2!);
    expect(onHostEventClick).not.toHaveBeenCalledWith(baseEvents[1]);
    const span4 = screen.getByText('Link4').closest('span');
    fireEvent.click(span4!);
    expect(onHostEventClick).not.toHaveBeenCalledWith(baseEvents[3]);
  });

  it('renders arrow icon for link events only', () => {
    render(<IrlHostTag hostEvents={baseEvents} onHostEventClick={onHostEventClick} />);
    // Only link events should have the arrow icon
    const link1 = screen.getByText('Event 1').closest('a');
    expect(link1?.querySelector('img')).toHaveAttribute('src', '/icons/arrow-blue.svg');
    const link3 = screen.getByText('Link3').closest('a');
    expect(link3?.querySelector('img')).toHaveAttribute('src', '/icons/arrow-blue.svg');
    // Spans should not have the icon
    const span2 = screen.getByText('Event 2').closest('span');
    expect(span2?.querySelector('img')).toBeNull();
    const span4 = screen.getByText('Link4').closest('span');
    expect(span4?.querySelector('img')).toBeNull();
  });

  it('renders with empty hostEvents', () => {
    render(<IrlHostTag hostEvents={[]} onHostEventClick={onHostEventClick} />);
    expect(screen.getByRole('button', { name: /host/i })).toBeInTheDocument();
    // No events in the list
    expect(screen.queryByText('Event 1')).not.toBeInTheDocument();
  });
}); 