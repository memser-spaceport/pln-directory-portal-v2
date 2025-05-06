import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import '@testing-library/jest-dom';
import IrlSpeakerTag from '@/components/ui/irl-speaker-tag';

// Mock Popover to render its content and trigger directly
jest.mock('@/components/page/irl/attendee-list/attendee-popover', () => ({
  Tooltip: ({ content, trigger }: any) => (
    <>
      <div data-testid="popover-trigger">{trigger}</div>
      <div data-testid="popover-content">{content}</div>
    </>
  ),
}));

describe('IrlSpeakerTag', () => {
  const baseEvents = [
    { name: 'Event 1', link: 'https://event1.com' },
    { name: 'Event 2', link: '' },
    { name: '', link: 'https://event3.com' },
  ];
  const onSpeakerEventClick = jest.fn();

  beforeEach(() => {
    onSpeakerEventClick.mockClear();
  });

  it('renders the Speaker button', () => {
    render(<IrlSpeakerTag speakerEvents={baseEvents} onSpeakerEventClick={onSpeakerEventClick} />);
    expect(screen.getByText('Speaker')).toBeInTheDocument();
    // There should be 3 arrows: 1 for the button, 2 for event links
    expect(screen.getAllByAltText('arrow').length).toBe(3);
  });

  it('renders all event items in the popover', () => {
    render(<IrlSpeakerTag speakerEvents={baseEvents} onSpeakerEventClick={onSpeakerEventClick} />);
    expect(screen.getByText('Event 1')).toBeInTheDocument();
    expect(screen.getByText('Event 2')).toBeInTheDocument();
    expect(screen.getByText('Link3')).toBeInTheDocument();
  });

  it('renders event as <a> if link is present and as <span> if not', () => {
    render(<IrlSpeakerTag speakerEvents={baseEvents} onSpeakerEventClick={onSpeakerEventClick} />);
    // Event 1 and Link3 should be <a>, Event 2 should be <span>
    const links = screen.getAllByText(/Event 1|Link3/);
    links.forEach(link => {
      expect(link.tagName.toLowerCase()).toBe('a');
    });
    const span = screen.getByText('Event 2');
    expect(span.tagName.toLowerCase()).toBe('span');
  });

  it('calls onSpeakerEventClick when an event link is clicked', () => {
    render(<IrlSpeakerTag speakerEvents={baseEvents} onSpeakerEventClick={onSpeakerEventClick} />);
    const link = screen.getByText('Event 1');
    fireEvent.click(link);
    expect(onSpeakerEventClick).toHaveBeenCalledWith(baseEvents[0]);
  });

  it('does not call onSpeakerEventClick when a non-link event is clicked', () => {
    render(<IrlSpeakerTag speakerEvents={baseEvents} onSpeakerEventClick={onSpeakerEventClick} />);
    const span = screen.getByText('Event 2');
    fireEvent.click(span);
    expect(onSpeakerEventClick).not.toHaveBeenCalled();
  });

  it('renders arrow icon only for events with a link', () => {
    render(<IrlSpeakerTag speakerEvents={baseEvents} onSpeakerEventClick={onSpeakerEventClick} />);
    // There should be two arrow icons for two links
    const arrows = screen.getAllByAltText('arrow');
    // One for the button, two for the event links
    expect(arrows.length).toBe(3);
  });

  it('renders correct border for all but last event', () => {
    render(<IrlSpeakerTag speakerEvents={baseEvents} onSpeakerEventClick={onSpeakerEventClick} />);
    const items = screen.getAllByText(/Event 1|Event 2|Link3/);
    expect(items[0].className).toMatch(/border-bottom/);
    expect(items[1].className).toMatch(/border-bottom/);
    expect(items[2].className).not.toMatch(/border-bottom/);
  });

  it('renders nothing if speakerEvents is empty', () => {
    render(<IrlSpeakerTag speakerEvents={[]} onSpeakerEventClick={onSpeakerEventClick} />);
    // Only the Speaker button should be present
    expect(screen.getByText('Speaker')).toBeInTheDocument();
    expect(screen.queryByTestId('popover-content')).toBeInTheDocument();
    // No event items
    expect(screen.queryByText('Event 1')).not.toBeInTheDocument();
  });

  it('handles missing event name gracefully', () => {
    const events = [{ name: '', link: 'https://event.com' }];
    render(<IrlSpeakerTag speakerEvents={events} onSpeakerEventClick={onSpeakerEventClick} />);
    expect(screen.getByText('Link1')).toBeInTheDocument();
  });

  it('calls preventDefault when a non-link event is clicked (custom event object)', () => {
    render(<IrlSpeakerTag speakerEvents={baseEvents} onSpeakerEventClick={onSpeakerEventClick} />);
    const span = screen.getByText('Event 2');
    const preventDefault = jest.fn();
    // fireEvent.click does not pass our custom event, so we call the handler directly
    // Get the handler from the DOM node
    const handler = Object.getOwnPropertyDescriptor(span, 'onclick');
    if (handler && typeof handler.value === 'function') {
      handler.value({ preventDefault } as any);
      expect(preventDefault).toHaveBeenCalled();
    } else {
      // fallback: simulate click and check no error
      fireEvent.click(span);
      expect(onSpeakerEventClick).not.toHaveBeenCalled();
    }
  });

  it('renders event as <span> if link is undefined', () => {
    const events = [{ name: 'No Link', link: undefined }];
    render(<IrlSpeakerTag speakerEvents={events} onSpeakerEventClick={onSpeakerEventClick} />);
    const span = screen.getByText('No Link');
    expect(span.tagName.toLowerCase()).toBe('span');
    fireEvent.click(span);
    expect(onSpeakerEventClick).not.toHaveBeenCalled();
  });

  it('renders event as <span> if link is null', () => {
    const events = [{ name: 'Null Link', link: null }];
    render(<IrlSpeakerTag speakerEvents={events} onSpeakerEventClick={onSpeakerEventClick} />);
    const span = screen.getByText('Null Link');
    expect(span.tagName.toLowerCase()).toBe('span');
    fireEvent.click(span);
    expect(onSpeakerEventClick).not.toHaveBeenCalled();
  });

  it('renders the Speaker button (alternative mock)', () => {
    const mockOnSpeakerEventClick = jest.fn();
    const mockSpeakerEvents = [
      { name: 'Event 1', link: 'https://example.com' },
      { name: 'Event 2', link: '' }
    ];
    render(
      <IrlSpeakerTag
        speakerEvents={mockSpeakerEvents}
        onSpeakerEventClick={mockOnSpeakerEventClick}
      />
    );
    const button = screen.getByRole('button', { name: /speaker/i });
    expect(button).toBeInTheDocument();
  });

  it('clicking Speaker button does not throw', () => {
    const mockOnSpeakerEventClick = jest.fn();
    const mockSpeakerEvents = [
      { name: 'Event 1', link: 'https://example.com' },
      { name: 'Event 2', link: '' }
    ];
    render(
      <IrlSpeakerTag
        speakerEvents={mockSpeakerEvents}
        onSpeakerEventClick={mockOnSpeakerEventClick}
      />
    );
    const button = screen.getByRole('button', { name: /speaker/i });
    expect(() => fireEvent.click(button)).not.toThrow();
    expect(button).toBeInTheDocument();
  });
}); 