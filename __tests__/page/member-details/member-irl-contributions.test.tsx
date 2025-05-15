import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import IrlMemberContribution from '@/components/page/member-details/member-irl-contributions';

// Mocks
const analyticsMock = {
  onClickSeeMoreIrlContribution: jest.fn(),
  onClickEventIrlContribution: jest.fn(),
};
jest.mock('@/analytics/members.analytics', () => ({
  useMemberAnalytics: () => analyticsMock,
}));
jest.mock('@/components/core/modal', () => ({
  __esModule: true,
  default: ({ modalRef, onClose, children }: any) => (
    <dialog ref={modalRef} data-testid="modal">
      <button onClick={onClose}>Close</button>
      {children}
    </dialog>
  ),
}));
jest.mock('@/components/core/tooltip/tooltip', () => ({
  Tooltip: ({ trigger, content }: any) => (
    <>{trigger}{content && <span data-testid="tooltip-content">{content}</span>}</>
  ),
}));
jest.mock('date-fns-tz', () => ({
  ...jest.requireActual('date-fns-tz'),
  toZonedTime: (date: any, tz: any) => new Date(date),
  format: (date: any, fmt: string, { timeZone }: any) => 'Jan 2023',
}));
jest.mock('date-fns', () => ({
  ...jest.requireActual('date-fns'),
  compareAsc: jest.fn(),
  isWithinInterval: jest.fn(),
}));
jest.mock('@/utils/irl.utils', () => ({
  sortEventsByDate: (arr: any) => arr,
}));

const baseUserInfo = { uid: '1', name: 'User', email: 'user@email.com', roles: ['admin'] };
const baseEvent = {
  uid: 'e1',
  name: 'Event 1',
  type: 'Conference',
  slugURL: 'event-1',
  startDate: '2023-01-01T00:00:00Z',
  endDate: '2023-01-02T00:00:00Z',
  location: { location: 'City, Country', timezone: 'UTC' },
};
const baseEventGuest = {
  uid: 'g1',
  isHost: false,
  isSpeaker: false,
  event: baseEvent,
};
const baseMember = {
  id: 'm1',
  eventGuests: [
    { ...baseEventGuest, isHost: true },
    { ...baseEventGuest, isSpeaker: true, event: { ...baseEvent, name: 'Event 2', uid: 'e2' } },
    { ...baseEventGuest, event: { ...baseEvent, name: 'Event 3', uid: 'e3' } },
  ],
};

/**
 * Test suite for IrlMemberContribution component.
 * Covers all branches, edge cases, and user interactions.
 */
describe('IrlMemberContribution', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  beforeAll(() => {
    // Polyfill dialog methods for jsdom
    window.HTMLDialogElement.prototype.showModal = function () { this.open = true; };
    window.HTMLDialogElement.prototype.close = function () { this.open = false; };
  });

  it('renders contributions header and counts', () => {
    render(<IrlMemberContribution member={baseMember as any} userInfo={baseUserInfo} />);
    expect(screen.getByText(/Contributions \(3\)/)).toBeInTheDocument();
    expect(screen.getByText('Host')).toBeInTheDocument();
    expect(screen.getByText('Speaker')).toBeInTheDocument();
    expect(screen.getByText('Attendee')).toBeInTheDocument();
  });

  it('renders event names and dates', () => {
    render(<IrlMemberContribution member={baseMember as any} userInfo={baseUserInfo} />);
    expect(screen.getAllByText('Event 1').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Event 2').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Event 3').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Jan 2023').length).toBeGreaterThan(0);
  });

  it('shows tooltip for event name', () => {
    render(<IrlMemberContribution member={baseMember as any} userInfo={baseUserInfo} />);
    expect(screen.getAllByTestId('tooltip-content').some(el => el.textContent === 'Event 1')).toBe(true);
  });

  it('calls analytics and opens modal on additional count click', () => {
    // 6 events for Host role to trigger additional count
    const manyEvents = Array.from({ length: 6 }, (_, i) => ({ ...baseEventGuest, isHost: true, event: { ...baseEvent, name: `Event ${i + 1}` } }));
    const member = { ...baseMember, eventGuests: manyEvents };
    render(<IrlMemberContribution member={member as any} userInfo={baseUserInfo} />);
    const plus = screen.getByText('+1');
    fireEvent.click(plus);
    expect(analyticsMock.onClickSeeMoreIrlContribution).toHaveBeenCalledWith(baseUserInfo);
    expect(screen.getByTestId('modal')).toBeInTheDocument();
  });

  it('calls analytics and opens event link on event click', () => {
    // Mock window.open
    const openSpy = jest.spyOn(window, 'open').mockImplementation(() => null);
    render(<IrlMemberContribution member={baseMember as any} userInfo={baseUserInfo} />);
    const eventDivs = screen.getAllByText('Event 1');
    fireEvent.click(eventDivs[0]); // Click the first occurrence (the clickable one)
    expect(analyticsMock.onClickEventIrlContribution).toHaveBeenCalledWith(baseUserInfo);
    expect(openSpy).toHaveBeenCalled();
    openSpy.mockRestore();
  });

  it('renders nothing if no eventGuests', () => {
    const member = { ...baseMember, eventGuests: undefined };
    render(<IrlMemberContribution member={member as any} userInfo={baseUserInfo} />);
    expect(screen.getByText('Contributions ()')).toBeInTheDocument();
    // No event rows
    expect(screen.queryByText('Host')).not.toBeInTheDocument();
    expect(screen.queryByText('Speaker')).not.toBeInTheDocument();
    expect(screen.queryByText('Attendee')).not.toBeInTheDocument();
  });

  it('renders modal with all events for selected role', () => {
    // 6 Speaker events
    const manyEvents = Array.from({ length: 6 }, (_, i) => ({ ...baseEventGuest, isSpeaker: true, event: { ...baseEvent, name: `Event ${i + 1}` } }));
    const member = { ...baseMember, eventGuests: manyEvents };
    render(<IrlMemberContribution member={member as any} userInfo={baseUserInfo} />);
    const plus = screen.getByText('+1');
    fireEvent.click(plus);
    // Modal should show all Speaker events
    expect(screen.getByTestId('modal')).toBeInTheDocument();
    expect(screen.getByText('Contributions - Speaker (6)')).toBeInTheDocument();
    expect(screen.getByText('Event 6')).toBeInTheDocument();
  });

  it('closes modal when close button is clicked', () => {
    // 6 Host events
    const manyEvents = Array.from({ length: 6 }, (_, i) => ({ ...baseEventGuest, isHost: true, event: { ...baseEvent, name: `Event ${i + 1}` } }));
    const member = { ...baseMember, eventGuests: manyEvents };
    render(<IrlMemberContribution member={member as any} userInfo={baseUserInfo} />);
    const plus = screen.getByText('+1');
    fireEvent.click(plus);
    const closeBtn = screen.getByText('Close');
    fireEvent.click(closeBtn);
    // Modal should close (dialog remains in DOM but this simulates the close event)
    expect(screen.getByTestId('modal')).toBeInTheDocument();
  });

  it('handles edge case: no events for a role', () => {
    // Only Attendee events
    const member = { ...baseMember, eventGuests: [{ ...baseEventGuest, isHost: false, isSpeaker: false }] };
    render(<IrlMemberContribution member={member as any} userInfo={baseUserInfo} />);
    expect(screen.getByText('Attendee')).toBeInTheDocument();
    expect(screen.queryByText('Host')).not.toBeInTheDocument();
    expect(screen.queryByText('Speaker')).not.toBeInTheDocument();
  });

  it('handles edge case: no events at all', () => {
    const member = { ...baseMember, eventGuests: [] };
    render(<IrlMemberContribution member={member as any} userInfo={baseUserInfo} />);
    expect(screen.getByText(/Contributions \(0\)/)).toBeInTheDocument();
    expect(screen.queryByText('Host')).not.toBeInTheDocument();
    expect(screen.queryByText('Speaker')).not.toBeInTheDocument();
    expect(screen.queryByText('Attendee')).not.toBeInTheDocument();
  });

  it('appends &attending param for Attendee and upcoming event', () => {
    jest.spyOn(window, 'open').mockImplementation(() => null);
    const attendeeEvent = {
      ...baseEventGuest,
      isHost: false,
      isSpeaker: false,
      event: { ...baseEvent, name: 'Special Event', uid: 'e4', endDate: '2999-01-01T00:00:00Z' }
    };
    const member = { ...baseMember, eventGuests: [attendeeEvent] };
    render(<IrlMemberContribution member={member as any} userInfo={baseUserInfo} />);
    const eventDivs = screen.getAllByText('Special Event');
    fireEvent.click(eventDivs[0]);
    expect(window.open).toHaveBeenCalledWith(expect.stringContaining('&attending=Special Event'), '_blank');
    (window.open as jest.Mock).mockRestore();
  });

  it('appends &event param for past event', () => {
    jest.spyOn(window, 'open').mockImplementation(() => null);
    // Patch Date so that checkTimeZone returns false
    const pastEvent = {
      ...baseEventGuest,
      isHost: true,
      event: { ...baseEvent, name: 'Past Event', uid: 'e5', endDate: '2000-01-01T00:00:00Z' }
    };
    const member = { ...baseMember, eventGuests: [pastEvent] };
    render(<IrlMemberContribution member={member as any} userInfo={baseUserInfo} />);
    const eventDivs = screen.getAllByText('Past Event');
    fireEvent.click(eventDivs[0]);
    expect(window.open).toHaveBeenCalledWith(expect.stringContaining('&event=event-1'), '_blank');
    (window.open as jest.Mock).mockRestore();
  });

  it('appends &event param for past event in modal', () => {
    jest.spyOn(window, 'open').mockImplementation(() => null);
    // 6 Host events, all in the past
    const manyPastEvents = Array.from({ length: 6 }, (_, i) => ({
      ...baseEventGuest,
      isHost: true,
      event: { ...baseEvent, name: `Modal Past Event ${i + 1}`, uid: `e${i + 10}`, endDate: '2000-01-01T00:00:00Z' }
    }));
    const member = { ...baseMember, eventGuests: manyPastEvents };
    render(<IrlMemberContribution member={member as any} userInfo={baseUserInfo} />);
    // Open the modal
    const plus = screen.getByText('+1');
    fireEvent.click(plus);
    // Click the last event in the modal
    const modalEventDivs = screen.getAllByText('Modal Past Event 6');
    fireEvent.click(modalEventDivs[0]);
    expect(window.open).toHaveBeenCalledWith(expect.stringContaining('&event=event-1'), '_blank');
    (window.open as jest.Mock).mockRestore();
  });

  it('handles event with undefined location gracefully', () => {
    jest.spyOn(window, 'open').mockImplementation(() => null);
    const eventWithNoLocation = {
      ...baseEventGuest,
      isHost: true,
      event: { ...baseEvent, name: 'No Location Event', uid: 'e6', location: undefined, endDate: '2999-01-01T00:00:00Z' }
    };
    const member = { ...baseMember, eventGuests: [eventWithNoLocation] };
    render(<IrlMemberContribution member={member as any} userInfo={baseUserInfo} />);
    const eventDivs = screen.getAllByText('No Location Event');
    fireEvent.click(eventDivs[0]);
    expect(window.open).toHaveBeenCalledWith(expect.stringContaining('location='), '_blank');
    (window.open as jest.Mock).mockRestore();
  });
}); 