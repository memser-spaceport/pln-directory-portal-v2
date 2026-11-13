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

const drawerIsOpen = () => screen.queryByRole('button', { name: 'Back' }) !== null;

describe('EventDrawerView (LAB-3216)', () => {
  describe('the event', () => {
    it('Event with agenda and tags', () => {
      render(<Harness />);
      expect(screen.getByText('EVENT DETAILS')).toBeInTheDocument();
      expect(screen.getByText('In-Person')).toBeInTheDocument();
      expect(screen.getByText('FREE w/ RSVP')).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'LabWeek Lisbon' })).toBeInTheDocument();
      // The gathering block repeats it in a row the CSS hides (.gatheringLinks).
      expect(screen.getAllByText('1st Dec 2030, 09:00 - 5th Dec 2030, 18:00 (UTC +0:00)')[0]).toHaveClass('fact');
      expect(screen.getByText('Lisbon, Portugal')).toBeInTheDocument();
      const tags = screen.getByTestId('event-tags');
      expect(within(tags).getByText('Conference')).toBeInTheDocument();
      expect(within(tags).getByText('AI')).toBeInTheDocument();
      expect(screen.getByText('Protocol Labs')).toBeInTheDocument();
      expect(screen.getByText(/A week of builders, founders and funders/)).toBeInTheDocument();
      expect(screen.getByText(/The main stage runs Tuesday to Thursday/)).toBeInTheDocument();
      expect(screen.getByText('Agenda')).toBeInTheDocument();
      expect(screen.getByText('Day 1 - 1st Dec Sun')).toBeInTheDocument();
      expect(screen.getByText('Day 2 - 2nd Dec Mon')).toBeInTheDocument();
      expect(screen.getByText('Lisbon gathering')).toBeInTheDocument();
    });

    it('Event without agenda or tags', () => {
      render(<Harness raw={bareEventResponse()} />);
      expect(screen.queryByText('Agenda')).not.toBeInTheDocument();
      expect(screen.queryByTestId('event-tags')).not.toBeInTheDocument();
      expect(screen.queryByText('Host')).not.toBeInTheDocument();
      expect(screen.queryByText('Description')).not.toBeInTheDocument();
      expect(screen.queryByText('FREE w/ RSVP')).not.toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'LabWeek Lisbon' })).toBeInTheDocument();
      expect(screen.getByText('40 members going')).toBeInTheDocument();
    });

    it('Event no longer available', () => {
      const onClose = jest.fn();
      render(<Harness status="not-found" event={null} onClose={onClose} />);
      expect(screen.getByText('This event is no longer available')).toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: 'Close' }));
      expect(onClose).toHaveBeenCalled();
    });

    it('a failed load offers a retry and a close', () => {
      const onRetry = jest.fn();
      const onClose = jest.fn();
      render(<Harness status="error" event={null} onRetry={onRetry} onClose={onClose} />);
      expect(screen.getByRole('alert')).toHaveTextContent("We couldn't load this event");
      fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
      expect(onRetry).toHaveBeenCalled();
      fireEvent.click(screen.getByRole('button', { name: 'Close' }));
      expect(onClose).toHaveBeenCalled();
    });

    it('waits for the viewer plans before asking', () => {
      render(<Harness plans={null} />);
      expect(screen.getByLabelText('Loading the event')).toBeInTheDocument();
      expect(screen.queryByText(/Are you going/)).not.toBeInTheDocument();
    });

    it('while loading, keeps Back and the panel kicker so the drawer never reads as empty', () => {
      render(<Harness status="loading" event={null} />);
      const loading = screen.getByLabelText('Loading the event');
      expect(loading).toHaveAttribute('aria-busy', 'true');
      expect(within(loading).getByText('EVENT DETAILS')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Back' })).toBeInTheDocument();
    });

    it('fills the same drawer when the event arrives, instead of opening a second one', () => {
      const { rerender } = render(<Harness status="loading" event={null} />);
      const drawer = screen.getByRole('button', { name: 'Back' }).closest('.container') as HTMLElement;
      expect(drawer).not.toBeNull();

      rerender(<Harness />);

      const title = screen.getByRole('heading', { name: 'LabWeek Lisbon' });
      expect(drawer.contains(title)).toBe(true);
      expect(document.querySelectorAll('.container')).toHaveLength(1);
    });

    it("shows the event's picture as a thumbnail beside the title", () => {
      render(<Harness raw={eventResponse({ logo: 'https://cdn.test/logo.png' })} />);
      // The drawer renders in a portal, outside the render container.
      expect(document.querySelector('img.thumb')).toHaveAttribute('src', 'https://cdn.test/logo.png');
    });

    it('leaves the thumbnail out when the event has no picture', () => {
      render(<Harness raw={eventResponse({ logo: null, banner: null })} />);
      expect(screen.getByRole('heading', { name: 'LabWeek Lisbon' })).toBeInTheDocument();
      expect(document.querySelector('img.thumb')).toBeNull();
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
      expect(within(list).getAllByRole('listitem')[0]).toHaveTextContent('You');
      const ana = within(list).getByText('Ana Silva').closest('a');
      expect(ana).toHaveAttribute('href', '/members/m-1');
      expect(ana).toHaveAttribute('target', '_blank');
      expect(within(list).getByText('Host')).toBeInTheDocument();

      fireEvent.change(screen.getByLabelText('Search people going'), { target: { value: 'lighthouse' } });
      expect(
        within(list)
          .getAllByRole('link')
          .map((a) => a.textContent),
      ).toEqual([
        expect.stringContaining('Ana Silva'),
        expect.stringContaining('Ben Ortiz'),
        expect.stringContaining('Chen Wei'),
      ]);

      fireEvent.change(screen.getByLabelText('Search people going'), { target: { value: 'nobody-here' } });
      expect(within(list).getByText('Nobody going matches that search.')).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: 'Close' }));
      await waitFor(() => expect(screen.queryByTestId('event-attendees')).not.toBeInTheDocument());
      expect(drawerIsOpen()).toBe(true);
    });
  });

  describe('the going card (LAB-3225, LAB-3234)', () => {
    const goingEvent = eventResponse({ viewerGoing: true, viewer: { showOnProfile: true, roles: [] } });

    it('asks, with Register to the event page and no "No" or "Show on my profile"', () => {
      render(<Harness raw={eventResponse({ websiteUrl: 'https://labweek.test' })} />);
      const card = screen.getByTestId('rsvp-card');
      expect(within(card).getByText('Are you going?')).toBeInTheDocument();
      expect(within(card).getByRole('button', { name: "Yes, I'm going" })).toBeInTheDocument();
      expect(within(card).getByRole('link', { name: 'Register' })).toHaveAttribute('href', 'https://labweek.test');
      expect(screen.queryByRole('button', { name: 'No' })).not.toBeInTheDocument();
      expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
      expect(screen.queryByText(/Show on my profile/)).not.toBeInTheDocument();
    });

    it('sits before the agenda', () => {
      render(<Harness />);
      const card = screen.getByTestId('rsvp-card');
      const agenda = screen.getByText('Agenda');
      expect(card.compareDocumentPosition(agenda) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
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
      fireEvent.click(screen.getByRole('button', { name: 'Back' }));
      expect(onClose).toHaveBeenCalled();
      expect(onGoing).toHaveBeenCalledWith({ eventName: 'LabWeek Lisbon' });
    });

    it('no toast when the viewer was already going', () => {
      const onGoing = jest.fn();
      render(<Harness raw={goingEvent} plans={GOING_PLANS} onGoing={onGoing} />);
      fireEvent.click(screen.getByRole('button', { name: 'Back' }));
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
      fireEvent.click(screen.getByRole('button', { name: 'Back' }));
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
});
