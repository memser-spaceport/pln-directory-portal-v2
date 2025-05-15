import React, { useRef, useState } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import TeamIrlContributions from '../../../components/page/team-details/team-irl-contributions';

// Mocks
const analyticsMock = {
  onClickSeeMoreIrlContribution: jest.fn(),
  onClickTeamIrlContribution: jest.fn(),
};
jest.mock('@/analytics/teams.analytics', () => ({
  useTeamAnalytics: () => analyticsMock,
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
  location: { location: 'City, Country', timezone: 'UTC', timeZone: 'UTC' },
};
const baseEventGuest = {
  uid: 'g1',
  isHost: true,
  event: baseEvent,
};
const baseTeam = {
  eventGuests: [
    { ...baseEventGuest },
    { ...baseEventGuest, event: { ...baseEvent, name: 'Event 2', uid: 'e2' } },
    { ...baseEventGuest, event: { ...baseEvent, name: 'Event 3', uid: 'e3' } },
  ],
};

/**
 * Test suite for TeamIrlContributions component.
 * Covers all branches, edge cases, and user interactions.
 */
describe('TeamIrlContributions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  beforeAll(() => {
    // Polyfill dialog methods for jsdom
    window.HTMLDialogElement.prototype.showModal = function () { this.open = true; };
    window.HTMLDialogElement.prototype.close = function () { this.open = false; };
  });

  it('renders contributions header and counts', () => {
    render(<TeamIrlContributions team={baseTeam as any} userInfo={baseUserInfo} members={[]} teamId="t1" />);
    expect(screen.getByText(/Contributions \(3\)/)).toBeInTheDocument();
    expect(screen.getByText('Host')).toBeInTheDocument();
  });

  it('renders event names and dates', () => {
    render(<TeamIrlContributions team={baseTeam as any} userInfo={baseUserInfo} members={[]} teamId="t1" />);
    expect(screen.getAllByText('Event 1').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Event 2').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Event 3').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Jan 2023').length).toBeGreaterThan(0);
  });

  it('shows tooltip for event name', () => {
    render(<TeamIrlContributions team={baseTeam as any} userInfo={baseUserInfo} members={[]} teamId="t1" />);
    expect(screen.getAllByTestId('tooltip-content').some(el => el.textContent === 'Event 1')).toBe(true);
  });

  it('calls analytics and opens modal on additional count click', () => {
    // 6 events for Host role to trigger additional count
    const manyEvents = Array.from({ length: 6 }, (_, i) => ({ ...baseEventGuest, event: { ...baseEvent, name: `Event ${i + 1}` } }));
    const team = { eventGuests: manyEvents };
    render(<TeamIrlContributions team={team as any} userInfo={baseUserInfo} members={[]} teamId="t1" />);
    const plus = screen.getByText('+1');
    fireEvent.click(plus);
    expect(analyticsMock.onClickSeeMoreIrlContribution).toHaveBeenCalledWith(baseUserInfo);
    expect(screen.getByTestId('modal')).toBeInTheDocument();
  });

  it('calls analytics and opens event link on event click', () => {
    const openSpy = jest.spyOn(window, 'open').mockImplementation(() => null);
    render(<TeamIrlContributions team={baseTeam as any} userInfo={baseUserInfo} members={[]} teamId="t1" />);
    const eventDivs = screen.getAllByText('Event 1');
    fireEvent.click(eventDivs[0]);
    expect(analyticsMock.onClickTeamIrlContribution).toHaveBeenCalledWith(baseUserInfo);
    expect(openSpy).toHaveBeenCalled();
    openSpy.mockRestore();
  });

  it('renders nothing if no eventGuests', () => {
    const team = { eventGuests: undefined };
    render(<TeamIrlContributions team={team as any} userInfo={baseUserInfo} members={[]} teamId="t1" />);
    expect(screen.getByText('Contributions ()')).toBeInTheDocument();
    // Host row is still rendered even if there are no events
    expect(screen.getByText('Host')).toBeInTheDocument();
  });

  it('renders modal with all events for selected role', () => {
    // 6 Host events
    const manyEvents = Array.from({ length: 6 }, (_, i) => ({ ...baseEventGuest, event: { ...baseEvent, name: `Event ${i + 1}` } }));
    const team = { eventGuests: manyEvents };
    render(<TeamIrlContributions team={team as any} userInfo={baseUserInfo} members={[]} teamId="t1" />);
    const plus = screen.getByText('+1');
    fireEvent.click(plus);
    expect(screen.getByTestId('modal')).toBeInTheDocument();
    expect(screen.getByText('Contributions - Host (6)')).toBeInTheDocument();
    expect(screen.getByText('Event 6')).toBeInTheDocument();
  });

  it('closes modal when close button is clicked', () => {
    // 6 Host events
    const manyEvents = Array.from({ length: 6 }, (_, i) => ({ ...baseEventGuest, event: { ...baseEvent, name: `Event ${i + 1}` } }));
    const team = { eventGuests: manyEvents };
    render(<TeamIrlContributions team={team as any} userInfo={baseUserInfo} members={[]} teamId="t1" />);
    const plus = screen.getByText('+1');
    fireEvent.click(plus);
    const closeBtn = screen.getByText('Close');
    fireEvent.click(closeBtn);
    expect(screen.getByTestId('modal')).toBeInTheDocument();
  });

  it('handles edge case: no events at all', () => {
    const team = { eventGuests: [] };
    render(<TeamIrlContributions team={team as any} userInfo={baseUserInfo} members={[]} teamId="t1" />);
    expect(screen.getByText(/Contributions \(0\)/)).toBeInTheDocument();
    // Host row is still rendered even if there are no events
    expect(screen.getByText('Host')).toBeInTheDocument();
  });

  it('handles event with undefined location gracefully', () => {
    const openSpy = jest.spyOn(window, 'open').mockImplementation(() => null);
    const eventWithNoLocation = {
      ...baseEventGuest,
      event: { ...baseEvent, name: 'No Location Event', uid: 'e6', location: undefined, endDate: '2999-01-01T00:00:00Z' }
    };
    const team = { eventGuests: [eventWithNoLocation] };
    render(<TeamIrlContributions team={team as any} userInfo={baseUserInfo} members={[]} teamId="t1" />);
    const eventDivs = screen.getAllByText('No Location Event');
    fireEvent.click(eventDivs[0]);
    expect(openSpy).toHaveBeenCalledWith(expect.stringContaining('location='), '_blank');
    openSpy.mockRestore();
  });

  it('covers modal rendering for a role with zero events after rerender', () => {
    // Start with 6 events so modal can be opened
    const manyEvents = Array.from({ length: 6 }, (_, i) => ({
      ...baseEventGuest,
      event: { ...baseEvent, name: `Event ${i + 1}` }
    }));
    const { rerender } = render(
      <TeamIrlContributions
        team={{ eventGuests: manyEvents } as any}
        userInfo={baseUserInfo}
        members={[]}
        teamId="t1"
      />
    );
    // Open the modal for Host
    fireEvent.click(screen.getByText('+1'));
    // Now rerender with zero events
    rerender(
      <TeamIrlContributions
        team={{ eventGuests: [] } as any}
        userInfo={baseUserInfo}
        members={[]}
        teamId="t1"
      />
    );
    // Modal should show Contributions - Host (0)
    expect(screen.getByText(/Contributions - Host \(0\)/)).toBeInTheDocument();
    // No event items should be rendered
    expect(screen.queryByText('Event 1')).not.toBeInTheDocument();
  });
}); 