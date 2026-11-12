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
      expect(screen.getByText('40 People going')).toBeInTheDocument();
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
      expect(screen.getByRole('button', { name: '12 People going' })).toBeInTheDocument();
    });

    it('says "Person" for one attendee', () => {
      render(<Harness raw={eventResponse({ goingCount: 1 })} />);
      expect(screen.getByRole('button', { name: '1 Person going' })).toBeInTheDocument();
    });

    it('shows an empty state when nobody is going', () => {
      render(<Harness raw={eventResponse({ goingCount: 0, faces: [] })} />);
      expect(screen.queryByText(/People going/)).not.toBeInTheDocument();
      expect(screen.getByText('Nobody has said they are going yet.')).toBeInTheDocument();
    });

    it('Searching the list', async () => {
      const onAttendeesOpen = jest.fn();
      render(<Harness onAttendeesOpen={onAttendeesOpen} />);
      fireEvent.click(screen.getByRole('button', { name: '40 People going' }));
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

  describe('the question', () => {
    it('The question', () => {
      render(<Harness />);
      expect(screen.getByText('Are you going to LabWeek Lisbon?')).toBeInTheDocument();
      expect(screen.getByText('Let others know if you are attending.')).toBeInTheDocument();
      expect(screen.getByRole('checkbox', { name: 'Show on my profile' })).toBeChecked();
      expect(screen.getByText('Signed-in members will see LabWeek Lisbon on your profile.')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'No' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: "Yes, I'm going" })).toBeInTheDocument();
    });

    it('"No" closes without saving', () => {
      const onClose = jest.fn();
      const onYes = jest.fn();
      render(<Harness onClose={onClose} onYes={onYes} />);
      fireEvent.click(screen.getByRole('button', { name: 'No' }));
      expect(onClose).toHaveBeenCalled();
      expect(onYes).not.toHaveBeenCalled();
    });

    it('Going, shown on the profile: saves, counts the viewer and moves to the plans', async () => {
      const onYes = jest.fn(async () => true);
      render(<Harness onYes={onYes} />);
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: "Yes, I'm going" }));
      });
      expect(onYes).toHaveBeenCalledWith(true);
      expect(screen.getByText(/Thanks for confirming/)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '41 People going' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Skip' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
    });

    it('Going, not shown on the profile', async () => {
      const onYes = jest.fn(async () => true);
      render(<Harness onYes={onYes} />);
      fireEvent.click(screen.getByRole('checkbox', { name: 'Show on my profile' }));
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: "Yes, I'm going" }));
      });
      expect(onYes).toHaveBeenCalledWith(false);
    });

    it('Saving fails: stays on the question and the count does not change', async () => {
      const onYes = jest.fn(async () => false);
      render(<Harness onYes={onYes} />);
      fireEvent.click(screen.getByRole('checkbox', { name: 'Show on my profile' }));
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: "Yes, I'm going" }));
      });
      expect(screen.getByText('Are you going to LabWeek Lisbon?')).toBeInTheDocument();
      expect(screen.getByRole('checkbox', { name: 'Show on my profile' })).not.toBeChecked();
      expect(screen.getByRole('button', { name: '40 People going' })).toBeInTheDocument();
      expect(screen.queryByText(/Thanks for confirming/)).not.toBeInTheDocument();
    });

    it('Member without attendance permission', () => {
      render(<Harness canMarkGoing={false} plans={null} />);
      expect(screen.getByRole('button', { name: '40 People going' })).toBeInTheDocument();
      expect(screen.queryByText(/Are you going/)).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: "Yes, I'm going" })).not.toBeInTheDocument();
      expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    });
  });

  describe('the plans step', () => {
    const goingEvent = eventResponse({ viewerGoing: true, viewer: { showOnProfile: false, roles: [] } });

    it('opens directly for a viewer already going, with Cancel and their own answer', () => {
      render(<Harness raw={goingEvent} plans={GOING_PLANS} />);
      expect(screen.getByText(/Thanks for confirming/)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
      expect(screen.getByRole('checkbox', { name: 'Show on my profile' })).not.toBeChecked();
      expect(screen.queryByText(/Are you going/)).not.toBeInTheDocument();
    });

    it('opens on the plans for initialStep="plans"', () => {
      render(<Harness initialStep="plans" />);
      expect(screen.getByText(/Thanks for confirming/)).toBeInTheDocument();
    });

    it('Skipping the plans closes and tells the host', async () => {
      const onClose = jest.fn();
      const onGoing = jest.fn();
      const onSave = jest.fn();
      render(<Harness onClose={onClose} onGoing={onGoing} onSave={onSave} />);
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: "Yes, I'm going" }));
      });
      fireEvent.click(screen.getByRole('button', { name: 'Skip' }));
      expect(onClose).toHaveBeenCalled();
      expect(onSave).not.toHaveBeenCalled();
      expect(onGoing).toHaveBeenCalledWith({ eventName: 'LabWeek Lisbon', showOnProfile: true });
    });

    it('Adding another event of the gathering, as Speaker', async () => {
      const onSave = jest.fn(async () => true);
      const onClose = jest.fn();
      render(<Harness onSave={onSave} onClose={onClose} />);
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: "Yes, I'm going" }));
      });

      fireEvent.click(screen.getByText('Select events you plan to attend'));
      const picker = await screen.findByText('libp2p Day');
      fireEvent.click(picker);
      const row = screen.getByText('libp2p Day').closest('[role="button"]') as HTMLElement;
      fireEvent.click(within(row).getByRole('button', { name: 'Speaker' }));
      fireEvent.click(screen.getByRole('button', { name: 'Apply' }));

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Save' }));
      });
      expect(onSave).toHaveBeenCalledTimes(1);
      const values = (onSave.mock.calls[0] as unknown[])[0] as { selectedEventUids: string[]; eventRoles: unknown[] };
      expect(values.selectedEventUids).toEqual(['labweek-lisbon', 'libp2p-day']);
      expect(values.eventRoles).toEqual(
        expect.arrayContaining([{ eventUid: 'libp2p-day', roles: expect.arrayContaining(['Speaker']) }]),
      );
      expect(onClose).toHaveBeenCalled();
    });

    it('Unticking an event', async () => {
      const onSave = jest.fn(async () => true);
      render(<Harness raw={goingEvent} plans={GOING_PLANS} onSave={onSave} />);
      fireEvent.click(screen.getByText('Select events you plan to attend'));
      const row = (await screen.findAllByText('libp2p Day'))
        .map((el) => el.closest('[role="button"]'))
        .find(Boolean) as HTMLElement;
      fireEvent.click(row);
      fireEvent.click(screen.getByRole('button', { name: 'Apply' }));
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Save' }));
      });
      const values = (onSave.mock.calls[0] as unknown[])[0] as { selectedEventUids: string[]; topics: string[] };
      expect(values.selectedEventUids).toEqual(['labweek-lisbon']);
      expect(values.topics).toEqual(['AI']);
    });

    it('A failed save keeps the drawer open with the values', async () => {
      const onSave = jest.fn(async () => false);
      const onClose = jest.fn();
      render(<Harness raw={goingEvent} plans={GOING_PLANS} onSave={onSave} onClose={onClose} />);
      fireEvent.click(screen.getByRole('checkbox', { name: 'Show on my profile' }));
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Save' }));
      });
      expect(onSave).toHaveBeenCalledTimes(1);
      expect(onClose).not.toHaveBeenCalled();
      expect(screen.getByRole('checkbox', { name: 'Show on my profile' })).toBeChecked();
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Save' }));
      });
      expect(onSave).toHaveBeenCalledTimes(2);
    });

    it('Escape in the date picker closes only the picker', async () => {
      const onClose = jest.fn();
      render(<Harness raw={goingEvent} plans={GOING_PLANS} onClose={onClose} />);
      fireEvent.click(screen.getAllByText('Select date range')[0].closest('button') as HTMLElement);
      expect(await screen.findByRole('button', { name: 'Apply' })).toBeInTheDocument();

      fireEvent.keyDown(document, { key: 'Escape' });
      await waitFor(() => expect(screen.queryByRole('button', { name: 'Apply' })).not.toBeInTheDocument());
      expect(onClose).not.toHaveBeenCalled();
      expect(drawerIsOpen()).toBe(true);

      fireEvent.keyDown(document, { key: 'Escape' });
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });
});
