import React, { useState } from 'react';
import '@testing-library/jest-dom';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';

import {
  ATTENDEES,
  GOING_PLANS,
  NO_PLANS,
  bareEventResponse,
  eventResponse,
} from '@/components/page/events/EventDrawer/EventDrawer.fixtures';
import { EventDrawerView, type EventDrawerViewProps } from '@/components/page/events/EventDrawer/EventDrawerView';
import { toEventDetail } from '@/services/events/event-drawer.mappers';
import type { EventDetailResponse } from '@/services/events/event-drawer.types';

// react-calendar ships ESM only; the date picker's calendar is not what these tests look at.
jest.mock('react-calendar', () => ({ __esModule: true, default: () => <div data-testid="calendar" /> }));

/** The BE filters by name or team; the harness does the same on the fixture rows. */
function Harness(props: Partial<EventDrawerViewProps> & { raw?: EventDetailResponse }) {
  const { raw = eventResponse(), ...rest } = props;
  const [search, setSearch] = useState('');
  const needle = search.trim().toLowerCase();
  const rows = ATTENDEES.filter((a) => `${a.name} ${a.teamName}`.toLowerCase().includes(needle));
  return (
    <EventDrawerView
      status="ready"
      event={toEventDetail(raw)}
      canMarkGoing
      viewerUid="viewer-1"
      plans={NO_PLANS}
      member={{ teams: [], telegramHandle: null, officeHours: null }}
      attendees={{
        rows,
        isLoading: false,
        isError: false,
        hasNextPage: false,
        isFetchingNextPage: false,
        fetchNextPage: jest.fn(),
        search,
        onSearchChange: setSearch,
      }}
      saving={false}
      onClose={jest.fn()}
      onYes={jest.fn(async () => true)}
      onNotGoing={jest.fn(async () => true)}
      onSave={jest.fn(async () => true)}
      {...rest}
    />
  );
}

/** Types into who's going's search and presses Enter, which searches at once instead of after the pause. */
const searchPeople = (value: string) => {
  const input = screen.getByLabelText('Search people going');
  fireEvent.change(input, { target: { value } });
  fireEvent.keyUp(input, { key: 'Enter' });
};

const drawerIsOpen = () => screen.queryByTestId('event-drawer-toolbar') !== null;
/** The toolbar's close (the not-found and error states have a second Close in their body). */
const toolbarClose = () => within(screen.getByTestId('event-drawer-toolbar')).getByRole('button', { name: 'Close' });

describe('EventDrawerView (LAB-3216)', () => {
  describe('the event', () => {
    it('Event with agenda and tags', () => {
      render(<Harness />);
      expect(screen.queryByText('EVENT DETAILS')).not.toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'LabWeek Lisbon' })).toBeInTheDocument();
      // LAB-3361: a date tile, then the days and the time in the event's zone (Lisbon is UTC+0 in December).
      const when = screen.getByTestId('event-when');
      expect(within(when).getByText('DEC')).toBeInTheDocument();
      expect(within(when).getByText('1')).toBeInTheDocument();
      expect(within(when).getByText('Sun, Dec 1 – Thu, Dec 5')).toHaveClass('factMain');
      expect(within(when).getByText('9:00 AM – 6:00 PM · UTC+0')).toHaveClass('factSub');
      expect(screen.getByText('Lisbon, Portugal')).toBeInTheDocument();
      // LAB-3283: access is a fact row, and neither mode nor access is a badge.
      const access = screen.getByTestId('event-access');
      expect(within(access).getByText('Free')).toBeInTheDocument();
      expect(within(access).getByText('RSVP to save your spot')).toBeInTheDocument();
      expect(screen.queryByText('In-Person')).not.toBeInTheDocument();
      expect(screen.queryByText('FREE w/ RSVP')).not.toBeInTheDocument();
      const tags = screen.getByTestId('event-tags');
      expect(within(tags).getByText('Conference')).toBeInTheDocument();
      expect(within(tags).getByText('AI')).toBeInTheDocument();
      expect(screen.getByText('Protocol Labs').closest('p')).toHaveTextContent('Hosted by Protocol Labs');
      expect(screen.getByRole('heading', { name: 'About' })).toBeInTheDocument();
      expect(screen.getByText(/A week of builders, founders and funders/)).toBeInTheDocument();
      expect(screen.getByText(/The main stage runs Tuesday to Thursday/)).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Agenda' })).toBeInTheDocument();
      expect(screen.getByText('Sun, 1st Dec')).toBeInTheDocument();
      expect(screen.getByText('Mon, 2nd Dec')).toBeInTheDocument();
      // The tags close the About section, after the description.
      expect(
        screen.getByText(/The main stage runs/).compareDocumentPosition(screen.getByTestId('event-tags')) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
    });

    it('a one-day agenda has no day title, and its times use an en dash', () => {
      const base = eventResponse();
      const oneDay = { sessions: base.details!.agenda!.sessions.slice(0, 2) };
      render(<Harness raw={eventResponse({ details: { ...base.details!, agenda: oneDay } })} />);
      expect(screen.getByRole('heading', { name: 'Agenda' })).toBeInTheDocument();
      expect(screen.queryByText('Sun, 1st Dec')).not.toBeInTheDocument();
      expect(screen.getByText('9:00 AM – 10:00 AM')).toBeInTheDocument();
      expect(screen.getByText('Registration and coffee')).toBeInTheDocument();
    });

    it('No gathering links (LAB-3283)', () => {
      render(<Harness />);
      expect(screen.queryByText('Lisbon gathering')).not.toBeInTheDocument();
      expect(screen.queryByText('Telegram')).not.toBeInTheDocument();
      expect(screen.queryByText('Shared notes')).not.toBeInTheDocument();
      expect(screen.queryByText(/View all events/)).not.toBeInTheDocument();
      // The gathering still drives the going card and the plans.
      expect(screen.getByRole('button', { name: /Yes, I.m going/ })).toBeInTheDocument();
    });

    it('Hybrid event', () => {
      render(
        <Harness raw={eventResponse({ type: 'HYBRID', details: { ...eventResponse().details!, format: 'HYBRID' } })} />,
      );
      expect(screen.getByText('Lisbon, Portugal')).toBeInTheDocument();
      expect(screen.getByText('Hybrid, also online')).toHaveClass('factSub');
    });

    it('Online event', () => {
      render(
        <Harness
          raw={eventResponse({ type: 'VIRTUAL', details: { ...eventResponse().details!, format: 'VIRTUAL' } })}
        />,
      );
      expect(screen.getByText('Online')).toBeInTheDocument();
      expect(screen.getByText('Link sent after you register')).toBeInTheDocument();
      expect(screen.queryByText('Lisbon, Portugal')).not.toBeInTheDocument();
    });

    it('Invite-only event', () => {
      render(
        <Harness raw={eventResponse({ details: { ...eventResponse().details!, accessOption: 'Invite only' } })} />,
      );
      const access = screen.getByTestId('event-access');
      expect(within(access).getByText('Invite only')).toBeInTheDocument();
      expect(within(access).getByText('The hosts approve each guest')).toBeInTheDocument();
    });

    it('Paid event', () => {
      render(<Harness raw={eventResponse({ details: { ...eventResponse().details!, accessOption: 'PAID' } })} />);
      expect(within(screen.getByTestId('event-access')).getByText('Paid')).toBeInTheDocument();
      expect(screen.getByText("Tickets on the host's site")).toBeInTheDocument();
    });

    it('Event without agenda or tags', () => {
      render(<Harness raw={bareEventResponse()} />);
      expect(screen.queryByText('Agenda')).not.toBeInTheDocument();
      expect(screen.queryByTestId('event-tags')).not.toBeInTheDocument();
      expect(screen.queryByText('Host')).not.toBeInTheDocument();
      expect(screen.queryByText('About')).not.toBeInTheDocument();
      expect(screen.queryByTestId('event-access')).not.toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'LabWeek Lisbon' })).toBeInTheDocument();
      expect(screen.getByText('40 members going')).toBeInTheDocument();
    });

    it('Event no longer available', () => {
      const onClose = jest.fn();
      render(<Harness status="not-found" event={null} onClose={onClose} />);
      expect(screen.getByText('This event is no longer available')).toBeInTheDocument();
      fireEvent.click(within(screen.getByRole('status')).getByRole('button', { name: 'Close' }));
      fireEvent.click(toolbarClose());
      expect(onClose).toHaveBeenCalledTimes(2);
      // No event: no copy link, no events app, no previous / next.
      expect(screen.queryByRole('button', { name: 'Copy link' })).not.toBeInTheDocument();
      expect(screen.queryByRole('link', { name: /Open in PL Events/ })).not.toBeInTheDocument();
    });

    it('a failed load offers a retry and a close', () => {
      const onRetry = jest.fn();
      const onClose = jest.fn();
      render(<Harness status="error" event={null} onRetry={onRetry} onClose={onClose} />);
      expect(screen.getByRole('alert')).toHaveTextContent("We couldn't load this event");
      fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
      expect(onRetry).toHaveBeenCalled();
      fireEvent.click(within(screen.getByRole('alert')).getByRole('button', { name: 'Close' }));
      expect(onClose).toHaveBeenCalled();
    });

    it('waits for the viewer plans before asking', () => {
      render(<Harness plans={null} />);
      expect(screen.getByLabelText('Loading the event')).toBeInTheDocument();
      expect(screen.queryByText(/Are you going/)).not.toBeInTheDocument();
    });

    it('while loading, keeps the toolbar and a skeleton shaped like the event', () => {
      render(<Harness status="loading" event={null} />);
      const loading = screen.getByLabelText('Loading the event');
      expect(loading).toHaveAttribute('aria-busy', 'true');
      expect(within(loading).getByTestId('event-drawer-skeleton')).toBeInTheDocument();
      expect(toolbarClose()).toBeInTheDocument();
    });

    it('fills the same drawer when the event arrives, instead of opening a second one', () => {
      const { rerender } = render(<Harness status="loading" event={null} />);
      const drawer = toolbarClose().closest('.container') as HTMLElement;
      expect(drawer).not.toBeNull();

      rerender(<Harness />);

      const title = screen.getByRole('heading', { name: 'LabWeek Lisbon' });
      expect(drawer.contains(title)).toBe(true);
      expect(document.querySelectorAll('.container')).toHaveLength(1);
    });

    it("shows the event's picture as a thumbnail beside the title", () => {
      render(<Harness raw={eventResponse({ logo: 'https://cdn.test/logo.png' })} />);
      // The drawer renders in a portal, outside the render container.
      const logo = document.querySelector('img.logo');
      expect(logo).toHaveAttribute('src', 'https://cdn.test/logo.png');
      expect(logo?.nextElementSibling).toContainElement(screen.getByRole('heading', { name: 'LabWeek Lisbon' }));
    });

    it('leaves the thumbnail out when the event has no picture', () => {
      render(<Harness raw={eventResponse({ logo: null, banner: null })} />);
      expect(screen.getByRole('heading', { name: 'LabWeek Lisbon' })).toBeInTheDocument();
      expect(document.querySelector('img.logo')).toBeNull();
    });
  });

  describe('attendees', () => {
    it('Count for one event', () => {
      render(<Harness raw={eventResponse({ goingCount: 12 })} />);
      expect(screen.getByRole('button', { name: '12 members going' })).toBeInTheDocument();
    });

    it('says "member" for one attendee', () => {
      render(<Harness raw={eventResponse({ goingCount: 1 })} />);
      expect(screen.getByRole('button', { name: '1 member going' })).toBeInTheDocument();
    });

    it('shows an empty state when nobody is going', () => {
      render(<Harness raw={eventResponse({ goingCount: 0, faces: [] })} />);
      expect(screen.queryByText(/members? going/)).not.toBeInTheDocument();
      expect(screen.getByText('Nobody has said they are going yet.')).toBeInTheDocument();
    });

    it('Searching the list', async () => {
      const onAttendeesOpen = jest.fn();
      render(<Harness onAttendeesOpen={onAttendeesOpen} />);
      fireEvent.click(screen.getByRole('button', { name: '40 members going' }));
      expect(onAttendeesOpen).toHaveBeenCalledTimes(1);

      const list = screen.getByTestId('event-attendees');
      expect(screen.getByRole('heading', { name: '40 going to LabWeek Lisbon' })).toBeInTheDocument();
      const you = within(list).getAllByRole('listitem')[0];
      expect(you).toHaveTextContent('You');
      expect(you).toHaveTextContent('Founder · Atlas');
      expect(within(you).queryByRole('link')).not.toBeInTheDocument();
      const ana = within(list).getByText('Ana Silva').closest('a');
      expect(ana).toHaveAttribute('href', '/members/m-1');
      expect(ana).toHaveAttribute('target', '_blank');
      // The profile's muted role tags (LAB-3361), one per role.
      expect(within(list).getByText('Host')).toHaveClass('roleTag', 'roleTagHost');

      searchPeople('lighthouse');
      expect(
        within(list)
          .getAllByRole('link')
          .map((a) => a.textContent),
      ).toEqual([
        expect.stringContaining('Ana Silva'),
        expect.stringContaining('Ben Ortiz'),
        expect.stringContaining('Chen Wei'),
      ]);

      searchPeople('nobody-here');
      expect(within(list).getByText('Nobody going matches “nobody-here”.')).toBeInTheDocument();

      // LAB-3361: the list replaces the event inside the drawer; "Back to event" returns to it.
      expect(screen.queryByRole('heading', { name: 'LabWeek Lisbon' })).not.toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: 'Back to event' }));
      await waitFor(() => expect(screen.queryByTestId('event-attendees')).not.toBeInTheDocument());
      expect(screen.getByRole('heading', { name: 'LabWeek Lisbon' })).toBeInTheDocument();
      expect(drawerIsOpen()).toBe(true);
    });

    it('searches once the member stops typing', async () => {
      render(<Harness />);
      fireEvent.click(screen.getByRole('button', { name: '40 members going' }));
      const list = screen.getByTestId('event-attendees');
      const before = within(list).getAllByRole('link').length;
      fireEvent.change(screen.getByLabelText('Search people going'), { target: { value: 'lighthouse' } });
      expect(within(list).getAllByRole('link')).toHaveLength(before);
      await waitFor(() => expect(within(list).getAllByRole('link')).toHaveLength(3), { timeout: 2000 });
    });

    it('Escape on the list returns to the event, a second Escape closes the drawer', () => {
      const onClose = jest.fn();
      render(<Harness onClose={onClose} />);
      fireEvent.click(screen.getByRole('button', { name: '40 members going' }));
      expect(screen.getByTestId('event-attendees')).toBeInTheDocument();
      fireEvent.keyDown(document, { key: 'Escape' });
      expect(screen.queryByTestId('event-attendees')).not.toBeInTheDocument();
      expect(screen.getByTestId('rsvp-card')).toBeInTheDocument();
      expect(onClose).not.toHaveBeenCalled();
      fireEvent.keyDown(document, { key: 'Escape' });
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('the going card (LAB-3225, LAB-3234)', () => {
    const goingEvent = eventResponse({ viewerGoing: true, viewer: { showOnProfile: true, roles: [] } });

    it('asks, with Register to the event page and no "No" or "Show on my profile"', () => {
      render(<Harness raw={eventResponse({ websiteUrl: 'https://labweek.test' })} />);
      const card = screen.getByTestId('rsvp-card');
      expect(within(card).getByText('Are you going?')).toBeInTheDocument();
      // LAB-3361: the press is back in the card, beside Register, as in the prototype.
      const yes = within(card).getByRole('button', { name: "Yes, I'm going" });
      const register = within(card).getByRole('link', { name: 'Register' });
      expect(register).toHaveAttribute('href', 'https://labweek.test');
      expect(yes.parentElement).toBe(register.parentElement);
      expect(screen.getAllByRole('button', { name: "Yes, I'm going" })).toHaveLength(1);
      expect(screen.queryByRole('button', { name: 'No' })).not.toBeInTheDocument();
      expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
      expect(screen.queryByText(/Show on my profile/)).not.toBeInTheDocument();
    });

    it('sits right after the facts, before About and the agenda', () => {
      render(<Harness />);
      const card = screen.getByTestId('rsvp-card');
      const access = screen.getByTestId('event-access');
      expect(access.compareDocumentPosition(card) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      for (const heading of ['About', 'Agenda']) {
        const section = screen.getByRole('heading', { name: heading });
        expect(card.compareDocumentPosition(section) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      }
    });

    it('leaves Register out when the event has no page', () => {
      render(<Harness raw={eventResponse({ websiteUrl: null })} />);
      expect(screen.queryByRole('link', { name: 'Register' })).not.toBeInTheDocument();
    });

    it('"Yes, I\'m going" turns the card to "You\'re going" in place and counts the viewer', async () => {
      const onYes = jest.fn(async () => true);
      render(<Harness onYes={onYes} />);
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: "Yes, I'm going" }));
      });
      expect(onYes).toHaveBeenCalledTimes(1);
      const card = screen.getByTestId('rsvp-card');
      expect(within(card).getByText("You're going")).toBeInTheDocument();
      expect(within(card).getByRole('button', { name: 'You and 40 members' })).toBeInTheDocument();
      expect(within(card).getByRole('button', { name: /Add your plans for Lisbon/ })).toBeInTheDocument();
      expect(within(card).getByRole('button', { name: 'Mark as not going' })).toBeInTheDocument();
      // Still the event, not a plans step.
      expect(screen.getByText('Agenda')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Save' })).not.toBeInTheDocument();
    });

    it('a failed "Yes" keeps asking and the count does not change', async () => {
      render(<Harness onYes={jest.fn(async () => false)} />);
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: "Yes, I'm going" }));
      });
      expect(screen.getByText('Are you going?')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '40 members going' })).toBeInTheDocument();
    });

    it('says "You\'re the first one going" when the viewer is alone', () => {
      render(
        <Harness
          raw={eventResponse({ viewerGoing: true, goingCount: 1, viewer: { showOnProfile: true, roles: [] } })}
        />,
      );
      expect(screen.getByRole('button', { name: /You're the first one going/ })).toBeInTheDocument();
    });

    it('"Mark as not going" removes this event and asks again', async () => {
      const onNotGoing = jest.fn(async () => true);
      render(<Harness raw={goingEvent} plans={GOING_PLANS} onNotGoing={onNotGoing} />);
      expect(screen.getByText("You're going")).toBeInTheDocument();
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Mark as not going' }));
      });
      expect(onNotGoing).toHaveBeenCalledTimes(1);
      expect(screen.getByText('Are you going?')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '39 members going' })).toBeInTheDocument();
    });

    it('a failed "Mark as not going" keeps "You\'re going"', async () => {
      render(<Harness raw={goingEvent} plans={GOING_PLANS} onNotGoing={jest.fn(async () => false)} />);
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Mark as not going' }));
      });
      expect(screen.getByText("You're going")).toBeInTheDocument();
    });

    it('the toast waits for the drawer to close, and only after a "Yes" in this drawer', async () => {
      const onClose = jest.fn();
      const onGoing = jest.fn();
      render(<Harness onClose={onClose} onGoing={onGoing} />);
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: "Yes, I'm going" }));
      });
      expect(onGoing).not.toHaveBeenCalled();
      fireEvent.click(toolbarClose());
      expect(onClose).toHaveBeenCalled();
      expect(onGoing).toHaveBeenCalledWith({ eventName: 'LabWeek Lisbon' });
    });

    it('no toast when the viewer was already going', () => {
      const onGoing = jest.fn();
      render(<Harness raw={goingEvent} plans={GOING_PLANS} onGoing={onGoing} />);
      fireEvent.click(toolbarClose());
      expect(onGoing).not.toHaveBeenCalled();
    });

    it('no toast after "Yes" then "Mark as not going"', async () => {
      const onGoing = jest.fn();
      render(<Harness onGoing={onGoing} />);
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: "Yes, I'm going" }));
      });
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Mark as not going' }));
      });
      fireEvent.click(toolbarClose());
      expect(onGoing).not.toHaveBeenCalled();
    });

    it('Member without attendance permission: "Who\'s going", no question', () => {
      render(<Harness canMarkGoing={false} plans={null} />);
      expect(screen.getByText("Who's going")).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '40 members going' })).toBeInTheDocument();
      expect(screen.queryByText(/Are you going/)).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: "Yes, I'm going" })).not.toBeInTheDocument();
    });
  });

  describe('the plans sub-view', () => {
    const goingEvent = eventResponse({ viewerGoing: true, viewer: { showOnProfile: true, roles: [] } });

    const openPlans = () => fireEvent.click(screen.getByRole('button', { name: /Add your plans for Lisbon/ }));

    it('opens from "Add your plans": role chips, stay and topics, no events field', () => {
      render(<Harness raw={goingEvent} plans={GOING_PLANS} />);
      openPlans();
      expect(screen.getByRole('heading', { name: 'Your plans for Lisbon' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Back to event' })).toBeInTheDocument();
      expect(screen.getByRole('group', { name: 'Your role at LabWeek Lisbon' })).toBeInTheDocument();
      for (const role of ['Host', 'Speaker', 'Sponsor']) {
        expect(screen.getByRole('button', { name: role })).toHaveAttribute('aria-pressed', 'false');
      }
      expect(screen.queryByText('Select events you plan to attend')).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
    });

    it('opens on the plans for initialStep="plans" (the owner\'s Edit details)', () => {
      render(<Harness raw={goingEvent} plans={GOING_PLANS} initialStep="plans" />);
      expect(screen.getByRole('heading', { name: 'Your plans for Lisbon' })).toBeInTheDocument();
    });

    it('ignores initialStep="plans" for a viewer not going', () => {
      render(<Harness initialStep="plans" />);
      expect(screen.getByText('Are you going?')).toBeInTheDocument();
    });

    it("preselects this event's saved role", () => {
      render(
        <Harness
          raw={eventResponse({ viewerGoing: true, viewer: { showOnProfile: true, roles: ['Speaker'] } })}
          plans={{ ...GOING_PLANS, eventRoles: [{ eventUid: 'labweek-lisbon', roles: ['Speaker'] }] }}
          initialStep="plans"
        />,
      );
      expect(screen.getByRole('button', { name: 'Speaker' })).toHaveAttribute('aria-pressed', 'true');
      expect(screen.getByRole('button', { name: 'Host' })).toHaveAttribute('aria-pressed', 'false');
    });

    it('Save sends the roles and the shared plans, then returns to the event', async () => {
      const onSave = jest.fn(async () => true);
      render(<Harness raw={goingEvent} plans={GOING_PLANS} onSave={onSave} />);
      openPlans();
      fireEvent.click(screen.getByRole('button', { name: 'Host' }));
      fireEvent.click(screen.getByRole('button', { name: 'Sponsor' }));
      fireEvent.click(screen.getByRole('button', { name: 'Host' }));
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Save' }));
      });
      expect(onSave).toHaveBeenCalledTimes(1);
      const values = (onSave.mock.calls[0] as unknown[])[0] as Record<string, unknown>;
      expect(values.roles).toEqual(['Sponsor']);
      expect(values.topics).toEqual(['AI']);
      expect(values.reason).toBe('Happy to talk storage.');
      expect(values.telegramId).toBe('@mayaokonkwo');
      expect(values.dateRange).toEqual([expect.any(Date), expect.any(Date)]);
      expect(values).not.toHaveProperty('selectedEventUids');
      expect(screen.getByText("You're going")).toBeInTheDocument();
    });

    it('Cancel and "Back to event" return to the event without saving', () => {
      const onSave = jest.fn();
      const onClose = jest.fn();
      render(<Harness raw={goingEvent} plans={GOING_PLANS} onSave={onSave} onClose={onClose} />);
      openPlans();
      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
      expect(screen.getByText("You're going")).toBeInTheDocument();
      openPlans();
      fireEvent.click(screen.getByRole('button', { name: 'Back to event' }));
      expect(screen.getByText("You're going")).toBeInTheDocument();
      expect(onSave).not.toHaveBeenCalled();
      expect(onClose).not.toHaveBeenCalled();
    });

    it('A failed save keeps the plans open with the values', async () => {
      const onSave = jest.fn(async () => false);
      render(<Harness raw={goingEvent} plans={GOING_PLANS} onSave={onSave} initialStep="plans" />);
      fireEvent.click(screen.getByRole('button', { name: 'Speaker' }));
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Save' }));
      });
      expect(onSave).toHaveBeenCalledTimes(1);
      expect(screen.getByRole('heading', { name: 'Your plans for Lisbon' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Speaker' })).toHaveAttribute('aria-pressed', 'true');
    });

    it('Escape: the date picker first, then the plans, then the drawer', async () => {
      const onClose = jest.fn();
      render(<Harness raw={goingEvent} plans={GOING_PLANS} onClose={onClose} initialStep="plans" />);
      fireEvent.click(screen.getAllByText('Select date range')[0].closest('button') as HTMLElement);
      expect(await screen.findByRole('button', { name: 'Apply' })).toBeInTheDocument();

      fireEvent.keyDown(document, { key: 'Escape' });
      await waitFor(() => expect(screen.queryByRole('button', { name: 'Apply' })).not.toBeInTheDocument());
      expect(screen.getByRole('heading', { name: 'Your plans for Lisbon' })).toBeInTheDocument();

      fireEvent.keyDown(document, { key: 'Escape' });
      expect(screen.getByText("You're going")).toBeInTheDocument();
      expect(onClose).not.toHaveBeenCalled();

      fireEvent.keyDown(document, { key: 'Escape' });
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });
  describe('LAB-3271: sticky "Yes, I\'m going", event link and sign-in', () => {
    it('removes "Yes, I\'m going" once the viewer is going', async () => {
      render(<Harness />);
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: "Yes, I'm going" }));
      });
      expect(screen.queryByRole('button', { name: "Yes, I'm going" })).not.toBeInTheDocument();
      expect(within(screen.getByTestId('rsvp-card')).getByText("You're going")).toBeInTheDocument();
    });

    it('shows the event link beside the date and the address, in a new tab', () => {
      render(<Harness raw={eventResponse({ websiteUrl: 'https://lu.ma/labweek-lisbon' })} />);
      const link = screen.getByRole('link', { name: 'lu.ma/labweek-lisbon' });
      expect(link).toHaveAttribute('href', 'https://lu.ma/labweek-lisbon');
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('has no link row when the event has no page, or the page is not a web address', () => {
      const { unmount } = render(<Harness raw={eventResponse({ websiteUrl: null })} />);
      expect(screen.queryByRole('link', { name: /lu\.ma|labweek/ })).not.toBeInTheDocument();
      unmount();
      render(<Harness raw={eventResponse({ websiteUrl: 'javascript:alert(1)' })} />);
      expect(screen.queryByRole('link', { name: /alert/ })).not.toBeInTheDocument();
    });

    it('signed out: "Yes, I\'m going" and the count start sign-in, and nothing saves', () => {
      const onSignIn = jest.fn();
      const onYes = jest.fn(async () => true);
      render(<Harness canMarkGoing={false} viewerUid={null} plans={null} onSignIn={onSignIn} onYes={onYes} />);
      // LAB-3361: with "Yes" back in the card, the card asks a signed-out visitor too.
      const card = screen.getByTestId('rsvp-card');
      expect(within(card).getByText('Are you going?')).toBeInTheDocument();
      fireEvent.click(within(card).getByRole('button', { name: "Yes, I'm going" }));
      expect(onSignIn).toHaveBeenCalledTimes(1);
      fireEvent.click(screen.getByRole('button', { name: '40 members going' }));
      expect(onSignIn).toHaveBeenCalledTimes(2);
      expect(screen.queryByText(/40 going to/)).not.toBeInTheDocument();
      expect(onYes).not.toHaveBeenCalled();
    });

    it('signed in without permission: no press', () => {
      render(<Harness canMarkGoing={false} plans={null} />);
      expect(screen.queryByRole('button', { name: "Yes, I'm going" })).not.toBeInTheDocument();
    });
  });

  describe('LAB-3324: the location arrow opens the map', () => {
    const MAP = 'https://www.google.com/maps/search/?api=1&query=Lisbon';
    const withMap = (locationUrl: string | null | undefined) => {
      const base = eventResponse();
      return eventResponse({ details: { ...base.details!, locationUrl } });
    };

    it('LAB-3324 R1: with a location link, the address and its arrow open the map in a new tab', () => {
      render(<Harness raw={withMap(MAP)} />);
      const link = screen.getByRole('link', { name: 'Lisbon, Portugal' });
      expect(link).toHaveAttribute('href', MAP);
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
      // The arrow is inside the same link, so a press on it opens the map too.
      expect(link.querySelector('svg')).not.toBeNull();
    });

    it('LAB-3324 R2: without a location link, the address is plain text with no arrow', () => {
      for (const locationUrl of [undefined, null, '', 'javascript:alert(1)']) {
        const { unmount } = render(<Harness raw={withMap(locationUrl)} />);
        const address = screen.getByText('Lisbon, Portugal');
        expect(address.closest('a')).toBeNull();
        expect(screen.queryByRole('link', { name: 'Lisbon, Portugal' })).not.toBeInTheDocument();
        // No arrow beside the address: its row holds only the pin.
        expect((address.closest('.fact') as HTMLElement).querySelectorAll('svg')).toHaveLength(1);
        unmount();
      }
    });

    // LAB-3283 + LAB-3324: the place row keeps its mode wording, and only a place with an address links to the map.
    const withMode = (format: 'HYBRID' | 'VIRTUAL') => {
      const base = eventResponse();
      return eventResponse({ type: format, details: { ...base.details!, format, locationUrl: MAP } });
    };

    it('a hybrid event links the address to the map, with "Hybrid, also online" under it', () => {
      render(<Harness raw={withMode('HYBRID')} />);
      expect(screen.getByRole('link', { name: 'Lisbon, Portugal' })).toHaveAttribute('href', MAP);
      expect(screen.getByText('Hybrid, also online').closest('a')).toBeNull();
    });

    it('an online event never links to a map, even with a location link', () => {
      render(<Harness raw={withMode('VIRTUAL')} />);
      expect(screen.getByText('Online').closest('a')).toBeNull();
      expect(screen.queryByRole('link', { name: /Online/ })).not.toBeInTheDocument();
    });
  });

  describe('LAB-3333: the event link row looks like the date row', () => {
    const URL_ = 'https://lu.ma/labweek-lisbon';

    it('LAB-3333 R1: shows the link row directly under the address', () => {
      render(<Harness raw={eventResponse({ websiteUrl: URL_ })} />);
      const row = screen.getByTestId('event-link-row');
      const addressRow = screen.getByText('Lisbon, Portugal').closest('.fact') as HTMLElement;
      expect(addressRow.nextElementSibling).toBe(row);
    });

    it('LAB-3333 R2, R3 (LAB-3361 tiles): a link glyph in a tile like the place, the text like the day line, no arrow', () => {
      render(<Harness raw={eventResponse({ websiteUrl: URL_ })} />);
      const row = screen.getByTestId('event-link-row');
      const tile = row.querySelector('.factIcon') as HTMLElement;
      const placeTile = screen.getByTestId('event-place').querySelector('.factIcon') as HTMLElement;
      expect(tile.className).toBe(placeTile.className);
      expect(tile.querySelector('svg')).toHaveAttribute('width', '20');
      const text = within(row).getByText('lu.ma/labweek-lisbon');
      expect(text).toHaveClass('factMain');
      expect(within(screen.getByTestId('event-when')).getByText(/Dec 1/)).toHaveClass('factMain');
      // Only the icon: no trailing arrow inside the link.
      expect(row.querySelectorAll('svg')).toHaveLength(1);
      expect(screen.getByRole('link', { name: 'lu.ma/labweek-lisbon' }).querySelector('svg')).toBeNull();
    });

    it('LAB-3333 R4: the link opens the event page in a new tab', () => {
      render(<Harness raw={eventResponse({ websiteUrl: URL_ })} />);
      const link = within(screen.getByTestId('event-link-row')).getByRole('link');
      expect(link).toHaveAttribute('href', URL_);
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('LAB-3333 R5: no link, no row', () => {
      for (const websiteUrl of [null, '', 'javascript:alert(1)']) {
        const { unmount } = render(<Harness raw={eventResponse({ websiteUrl })} />);
        expect(screen.queryByTestId('event-link-row')).not.toBeInTheDocument();
        unmount();
      }
    });
  });

  describe('LAB-3334: websiteUrl first, the Registration resource as fallback', () => {
    const SITE = 'https://lu.ma/labweek-lisbon';
    const REG = 'https://luma.com/n4ad0k9m';
    const resources = [{ name: 'Registration', link: REG, description: 'Registration URL' }];
    const register = () => within(screen.getByTestId('rsvp-card')).queryByRole('link', { name: 'Register' });

    it('LAB-3334 R1: the link row and Register use websiteUrl when it is a web address', () => {
      render(<Harness raw={eventResponse({ websiteUrl: SITE, resources })} />);
      const link = within(screen.getByTestId('event-link-row')).getByRole('link');
      expect(link).toHaveAttribute('href', SITE);
      expect(register()).toHaveAttribute('href', SITE);
    });

    it('LAB-3334 R2: the link row and Register use the Registration link, in a new tab, when websiteUrl is not valid', () => {
      for (const websiteUrl of [null, '', 'javascript:alert(1)']) {
        const { unmount } = render(<Harness raw={eventResponse({ websiteUrl, resources })} />);
        const link = within(screen.getByTestId('event-link-row')).getByRole('link', { name: 'luma.com/n4ad0k9m' });
        expect(link).toHaveAttribute('href', REG);
        expect(link).toHaveAttribute('target', '_blank');
        expect(register()).toHaveAttribute('href', REG);
        expect(register()).toHaveAttribute('target', '_blank');
        unmount();
      }
    });

    it('LAB-3334 R3: no link row and no Register when neither link is valid', () => {
      for (const websiteUrl of [null, '', 'javascript:alert(1)']) {
        const bad = [{ name: 'Registration', link: 'javascript:alert(2)', description: null }];
        const { unmount } = render(<Harness raw={eventResponse({ websiteUrl, resources: bad })} />);
        expect(screen.queryByTestId('event-link-row')).not.toBeInTheDocument();
        expect(register()).not.toBeInTheDocument();
        unmount();
      }
    });

    it('LAB-3334 R4: the name match ignores case and spaces at the ends', () => {
      render(<Harness raw={eventResponse({ websiteUrl: '', resources: [{ name: '  REGISTRATION ', link: REG }] })} />);
      expect(within(screen.getByTestId('event-link-row')).getByRole('link')).toHaveAttribute('href', REG);
      expect(register()).toHaveAttribute('href', REG);
    });

    it('keeps the LAB-3324 address map link', () => {
      const base = eventResponse();
      const map = 'https://www.google.com/maps/search/?api=1&query=Lisbon';
      render(
        <Harness raw={eventResponse({ websiteUrl: '', resources, details: { ...base.details!, locationUrl: map } })} />,
      );
      expect(screen.getByRole('link', { name: 'Lisbon, Portugal' })).toHaveAttribute('href', map);
    });
  });

  describe('LAB-3361: the toolbar', () => {
    const ORIGINAL = process.env.PL_EVENTS_BASE_URL;
    afterEach(() => {
      process.env.PL_EVENTS_BASE_URL = ORIGINAL;
    });

    it('copies the All Events link to this event and says "Copied"', async () => {
      const writeText = jest.fn(async () => undefined);
      Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
      const onLinkCopied = jest.fn();
      render(<Harness onLinkCopied={onLinkCopied} />);
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Copy link' }));
      });
      expect(writeText).toHaveBeenCalledWith(`${window.location.origin}/events/all?event=labweek-lisbon`);
      expect(screen.getByRole('button', { name: 'Link copied' })).toHaveTextContent('Copied');
      expect(onLinkCopied).toHaveBeenCalledTimes(1);
    });

    it('opens the event in PL Events by its id, in a new tab', () => {
      process.env.PL_EVENTS_BASE_URL = 'https://events.test/';
      const onEventsAppOpened = jest.fn();
      render(<Harness onEventsAppOpened={onEventsAppOpened} />);
      const link = screen.getByRole('link', { name: /Open in PL Events/ });
      expect(link).toHaveAttribute('href', 'https://events.test/calendar#ext-1');
      expect(link).toHaveAttribute('target', '_blank');
      fireEvent.click(link);
      expect(onEventsAppOpened).toHaveBeenCalledTimes(1);
    });

    it('leaves "Open in PL Events" out without the event id or the app address', () => {
      process.env.PL_EVENTS_BASE_URL = 'https://events.test';
      const { unmount } = render(<Harness raw={eventResponse({ externalId: null })} />);
      expect(screen.queryByRole('link', { name: /Open in PL Events/ })).not.toBeInTheDocument();
      unmount();
      delete process.env.PL_EVENTS_BASE_URL;
      render(<Harness />);
      expect(screen.queryByRole('link', { name: /Open in PL Events/ })).not.toBeInTheDocument();
    });

    it('steps through the list it was opened from, and stops at the ends', () => {
      const onNavigate = jest.fn();
      const { rerender } = render(<Harness sequence={['a', 'labweek-lisbon', 'c']} onNavigate={onNavigate} />);
      fireEvent.click(screen.getByRole('button', { name: 'Previous event' }));
      fireEvent.click(screen.getByRole('button', { name: 'Next event' }));
      expect(onNavigate.mock.calls).toEqual([
        ['a', 'previous'],
        ['c', 'next'],
      ]);

      rerender(<Harness sequence={['labweek-lisbon', 'c']} onNavigate={onNavigate} />);
      expect(screen.getByRole('button', { name: 'Previous event' })).toBeDisabled();
      expect(screen.getByRole('button', { name: 'Next event' })).toBeEnabled();
    });

    it('has no previous / next without a list, for a one-event list, or off the event view', () => {
      const onNavigate = jest.fn();
      const { rerender } = render(<Harness onNavigate={onNavigate} />);
      expect(screen.queryByRole('button', { name: 'Next event' })).not.toBeInTheDocument();
      rerender(<Harness sequence={['labweek-lisbon']} onNavigate={onNavigate} />);
      expect(screen.queryByRole('button', { name: 'Next event' })).not.toBeInTheDocument();
      rerender(<Harness sequence={['x', 'y']} onNavigate={onNavigate} />);
      expect(screen.queryByRole('button', { name: 'Next event' })).not.toBeInTheDocument();
      rerender(<Harness sequence={['labweek-lisbon', 'c']} onNavigate={onNavigate} />);
      fireEvent.click(screen.getByRole('button', { name: '40 members going' }));
      expect(screen.queryByRole('button', { name: 'Next event' })).not.toBeInTheDocument();
    });

    it('stepping away after a "Yes" in this drawer still says it is on the profile', async () => {
      const onGoing = jest.fn();
      const onNavigate = jest.fn();
      render(<Harness sequence={['labweek-lisbon', 'c']} onNavigate={onNavigate} onGoing={onGoing} />);
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: "Yes, I'm going" }));
      });
      fireEvent.click(screen.getByRole('button', { name: 'Next event' }));
      expect(onNavigate).toHaveBeenCalledWith('c', 'next');
      expect(onGoing).toHaveBeenCalledWith({ eventName: 'LabWeek Lisbon' });
    });
  });

  describe('LAB-3361: the pinned "Are you going?" bar', () => {
    let spy: jest.SpyInstance;
    /** The card's wrapper sits below the 800px scroller; everything else fills it. */
    const placeCard = (top: number) => {
      spy = jest.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
        const isCard = (this as HTMLElement).firstElementChild?.getAttribute('data-testid') === 'rsvp-card';
        const box = isCard ? { top, height: 200 } : { top: 0, height: 800 };
        return { ...box, bottom: box.top + box.height, left: 0, right: 640, width: 640, x: 0, y: box.top } as DOMRect;
      });
    };
    afterEach(() => spy?.mockRestore());

    it('stands in for the card once it is scrolled away, with the same question and press', async () => {
      placeCard(900);
      const onYes = jest.fn(async () => true);
      render(<Harness raw={eventResponse({ websiteUrl: 'https://labweek.test' })} onYes={onYes} />);
      const bar = screen.getByTestId('rsvp-bar');
      expect(within(bar).getByText('Are you going?')).toBeInTheDocument();
      expect(within(bar).getByText('40 members going')).toBeInTheDocument();
      expect(within(bar).getByRole('link', { name: 'Register' })).toHaveAttribute('href', 'https://labweek.test');
      await act(async () => {
        fireEvent.click(within(bar).getByRole('button', { name: "Yes, I'm going" }));
      });
      expect(onYes).toHaveBeenCalledTimes(1);
      expect(within(screen.getByTestId('rsvp-bar')).getByText("You're going")).toBeInTheDocument();
    });

    it('stays away while at least half of the card is on screen', () => {
      placeCard(650);
      render(<Harness />);
      expect(screen.queryByTestId('rsvp-bar')).not.toBeInTheDocument();
    });

    it('never shows for a member who cannot say they are going', () => {
      placeCard(900);
      render(<Harness canMarkGoing={false} plans={null} />);
      expect(screen.queryByTestId('rsvp-bar')).not.toBeInTheDocument();
    });
  });
});

describe('EventDrawerView: Edit and an event that is not approved (LAB-3340)', () => {
  const toolbar = () => within(screen.getByTestId('event-drawer-toolbar'));

  it('shows "Edit" in the toolbar only when the host passes the edit page', () => {
    const { unmount } = render(<Harness editHref="/events/edit/labweek-lisbon" />);
    expect(toolbar().getByRole('link', { name: 'Edit' })).toHaveAttribute('href', '/events/edit/labweek-lisbon');
    unmount();
    render(<Harness />);
    expect(toolbar().queryByRole('link', { name: 'Edit' })).not.toBeInTheDocument();
  });

  it('a submitted event shows its status and has no going card', () => {
    render(<Harness raw={eventResponse({ status: 'PENDING' })} editHref="/events/edit/labweek-lisbon" />);
    expect(screen.getByRole('status')).toHaveTextContent(
      'Status: Submitted. Only you and directory admins see this event.',
    );
    expect(screen.queryByRole('button', { name: "Yes, I'm going" })).not.toBeInTheDocument();
  });

  it('an approved event has no status line', () => {
    render(<Harness raw={eventResponse({ status: 'APPROVED' })} />);
    expect(screen.queryByText(/Only you and directory admins/)).not.toBeInTheDocument();
  });
});
