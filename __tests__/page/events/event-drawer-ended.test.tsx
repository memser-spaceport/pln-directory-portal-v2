import React from 'react';
import '@testing-library/jest-dom';
import { act, fireEvent, render, screen, within } from '@testing-library/react';

import {
  ATTENDEES,
  GOING_PLANS,
  NO_PLANS,
  eventResponse,
} from '@/components/page/events/EventDrawer/EventDrawer.fixtures';
import { EventDrawerView, type EventDrawerViewProps } from '@/components/page/events/EventDrawer/EventDrawerView';
import { toEventDetail } from '@/services/events/event-drawer.mappers';
import type { EventDetailResponse } from '@/services/events/event-drawer.types';

jest.mock('react-calendar', () => ({ __esModule: true, default: () => <div data-testid="calendar" /> }));

/** The fixture event runs Dec 1 to 5, 2030 in Lisbon and ends here. */
const END = new Date('2030-12-05T18:00:00.000Z').getTime();
const SECOND = 1000;
const HOUR = 60 * 60 * SECOND;

const PAGE = { websiteUrl: 'https://labweek.test' };
const GOING = { viewerGoing: true, viewer: { showOnProfile: true, roles: [] } };

type Props = Partial<EventDrawerViewProps> & { raw?: Partial<EventDetailResponse>; search?: string };

function view({ raw, search = '', attendees, ...rest }: Props = {}) {
  return (
    <EventDrawerView
      status="ready"
      event={toEventDetail(eventResponse({ ...PAGE, ...raw }))}
      canMarkGoing
      viewerUid="viewer-1"
      plans={NO_PLANS}
      member={{ teams: [], telegramHandle: null, officeHours: null }}
      attendees={{
        rows: ATTENDEES,
        isLoading: false,
        isError: false,
        hasNextPage: false,
        isFetchingNextPage: false,
        fetchNextPage: jest.fn(),
        search,
        onSearchChange: jest.fn(),
        ...attendees,
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

const SIGNED_OUT: Props = { canMarkGoing: false, viewerUid: null, plans: null };
const EMBED: Props = { ...SIGNED_OUT, rsvpHref: '/events/all?event=labweek-lisbon' };

const card = () => screen.getByTestId('ended-card');
const passTime = (ms: number) => act(() => void jest.advanceTimersByTime(ms));

/** Nothing in the drawer says, or asks, that the reader can still come. */
function expectNoRsvp() {
  for (const name of [/I.m going/, /Register/, /RSVP/, /plans/i, /not going/i]) {
    expect(screen.queryByRole('button', { name })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name })).not.toBeInTheDocument();
  }
  expect(screen.queryByText(/Are you going|You're going|Who's going|members? going|RSVP|register/i)).toBeNull();
  expect(screen.queryByTestId('rsvp-card')).not.toBeInTheDocument();
  expect(screen.queryByTestId('rsvp-bar')).not.toBeInTheDocument();
}

describe('EventDrawerView: an event that has ended (LAB-3426)', () => {
  beforeEach(() => jest.useFakeTimers({ now: END }));
  afterEach(() => jest.useRealTimers());

  describe('when it has ended', () => {
    it('one second before the end it still asks; at the end it has ended', () => {
      jest.setSystemTime(END - SECOND);
      const { unmount } = render(view());
      expect(screen.getByText('Are you going?')).toBeInTheDocument();
      expect(screen.queryByTestId('ended-card')).not.toBeInTheDocument();
      unmount();

      jest.setSystemTime(END);
      render(view());
      expect(within(card()).getByText('This event has ended')).toBeInTheDocument();
      expectNoRsvp();
    });

    it('a multi-day event still asks on the morning of its last day', () => {
      jest.setSystemTime(END - 10 * HOUR);
      render(view());
      expect(screen.getByText('Are you going?')).toBeInTheDocument();
    });

    it("an event in another time zone ends at its own end, when the viewer's day is another", () => {
      // 9 PM on Nov 19 in New York, which is Nov 20 in UTC.
      const raw = {
        startDate: '2030-11-19T23:00:00.000Z',
        endDate: '2030-11-20T02:00:00.000Z',
        timezone: 'America/New_York',
      };
      jest.setSystemTime(new Date('2030-11-20T01:59:59.000Z'));
      const { unmount } = render(view({ raw }));
      expect(screen.getByText('Are you going?')).toBeInTheDocument();
      unmount();

      jest.setSystemTime(new Date('2030-11-20T02:00:00.000Z'));
      render(view({ raw }));
      expect(screen.getByText('Tuesday, November 19')).toBeInTheDocument();
      expect(card()).toBeInTheDocument();
    });
  });

  describe('the year in the date line (LAB-3418)', () => {
    const when = () => screen.getByTestId('event-when');

    it('carries the year once another year has come, and not before', () => {
      const { unmount } = render(view());
      expect(when()).toHaveTextContent('Sun, Dec 1 – Thu, Dec 5');
      expect(when()).not.toHaveTextContent('2030');
      unmount();

      jest.setSystemTime(new Date('2031-01-01T00:00:00.000Z'));
      render(view());
      expect(within(when()).getByText('Sun, Dec 1 – Thu, Dec 5, 2030')).toBeInTheDocument();
    });

    it('an event that has not ended has no year, next year’s included', () => {
      jest.setSystemTime(new Date('2029-06-01T00:00:00.000Z'));
      render(view());
      expect(within(when()).getByText('Sun, Dec 1 – Thu, Dec 5')).toBeInTheDocument();
    });

    it('does not change while the drawer stays open', () => {
      jest.setSystemTime(new Date('2030-12-31T23:59:59.000Z'));
      const { rerender } = render(view());
      passTime(2 * SECOND);
      rerender(view());
      expect(within(when()).getByText('Sun, Dec 1 – Thu, Dec 5')).toBeInTheDocument();
    });

    it('the date line it falls back to has had the year all along', () => {
      expect(toEventDetail(eventResponse()).dateLine).toMatch(/Dec 2030/);
    });
  });

  describe('the card', () => {
    it('others went: "This event has ended", the faces and "N members went"', () => {
      render(view());
      expect(within(card()).getByText('This event has ended')).toBeInTheDocument();
      const people = within(card()).getByRole('button', { name: '40 members went' });
      expect(people.querySelectorAll('img')).toHaveLength(3);
      expect(screen.queryByText('You went')).not.toBeInTheDocument();
      expectNoRsvp();
    });

    it('one other member went: "1 member went"', () => {
      render(view({ raw: { goingCount: 1 } }));
      expect(within(card()).getByRole('button', { name: '1 member went' })).toBeInTheDocument();
    });

    it('the viewer went: "You went" with the check, "You and N members"', () => {
      render(view({ raw: { ...GOING, goingCount: 13 }, plans: GOING_PLANS }));
      const title = within(card()).getByText('You went');
      expect(title).toHaveClass('cardTitleGoing');
      expect(title.querySelector('svg')).not.toBeNull();
      expect(within(card()).getByRole('button', { name: 'You and 12 members' })).toBeInTheDocument();
      expect(screen.queryByText('This event has ended')).not.toBeInTheDocument();
      expectNoRsvp();
    });

    it('the viewer and one other: "You and 1 member"', () => {
      render(view({ raw: { ...GOING, goingCount: 2 }, plans: GOING_PLANS }));
      expect(within(card()).getByRole('button', { name: 'You and 1 member' })).toBeInTheDocument();
    });

    it('only the viewer: "Nobody else said they were going.", which still opens the list', () => {
      render(view({ raw: { ...GOING, goingCount: 1 }, plans: GOING_PLANS }));
      expect(within(card()).getByText('You went')).toBeInTheDocument();
      expect(screen.queryByText(/first one going/)).not.toBeInTheDocument();
      fireEvent.click(within(card()).getByRole('button', { name: 'Nobody else said they were going.' }));
      expect(screen.getByRole('heading', { name: '1 went to LabWeek Lisbon' })).toBeInTheDocument();
    });

    it('nobody went: "Nobody said they were going.", with nothing to press', () => {
      render(view({ raw: { goingCount: 0, faces: [] } }));
      expect(within(card()).getByText('This event has ended')).toBeInTheDocument();
      expect(within(card()).getByText('Nobody said they were going.')).toBeInTheDocument();
      expect(within(card()).queryByRole('button')).not.toBeInTheDocument();
      expectNoRsvp();
    });

    it('sits where the going card does: after the facts, before About', () => {
      render(view());
      const follows = (a: Element, b: Element) => a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING;
      expect(follows(screen.getByTestId('event-place'), card())).toBeTruthy();
      expect(follows(card(), screen.getByRole('heading', { name: 'About' }))).toBeTruthy();
    });

    it('a member without attendance permission sees the same card', () => {
      render(view({ canMarkGoing: false, plans: null }));
      expect(within(card()).getByText('This event has ended')).toBeInTheDocument();
      expectNoRsvp();
    });
  });

  describe('who went', () => {
    it('the faces open the list, titled "N went to <event>"', () => {
      const onAttendeesOpen = jest.fn();
      render(view({ onAttendeesOpen }));
      fireEvent.click(within(card()).getByRole('button', { name: '40 members went' }));
      expect(onAttendeesOpen).toHaveBeenCalledTimes(1);
      expect(screen.getByRole('heading', { name: '40 went to LabWeek Lisbon' })).toBeInTheDocument();
      expect(screen.getByLabelText('Search people who went')).toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: 'Back to event' }));
      expect(card()).toBeInTheDocument();
    });

    it('its empty and error lines are in the past too', () => {
      const lines: [Partial<EventDrawerViewProps['attendees']>, string][] = [
        [{ search: 'zed' }, 'Nobody who went matches “zed”.'],
        [{}, 'Nobody said they were going.'],
        [{ isError: true }, "We couldn't load who went."],
      ];
      for (const [state, line] of lines) {
        const attendees = { rows: [], ...state } as unknown as EventDrawerViewProps['attendees'];
        const { unmount } = render(view({ attendees }));
        fireEvent.click(within(card()).getByRole('button', { name: '40 members went' }));
        expect(within(screen.getByTestId('event-attendees')).getByText(line)).toBeInTheDocument();
        unmount();
      }
    });
  });

  describe('the facts', () => {
    const withDetails = (details: Partial<NonNullable<EventDetailResponse['details']>>) => ({
      raw: { details: { ...eventResponse().details!, ...details } },
    });

    it('an online event reads "Online event" under "Online"', () => {
      render(view(withDetails({ format: 'VIRTUAL' })));
      const place = screen.getByTestId('event-place');
      expect(within(place).getByText('Online')).toBeInTheDocument();
      expect(within(place).getByText('Online event')).toBeInTheDocument();
      expect(screen.queryByText('Link sent after you register')).not.toBeInTheDocument();
    });

    it('an online event that has not ended keeps "Link sent after you register"', () => {
      jest.setSystemTime(END - SECOND);
      render(view(withDetails({ format: 'VIRTUAL' })));
      expect(screen.getByText('Link sent after you register')).toBeInTheDocument();
      expect(screen.queryByText('Online event')).not.toBeInTheDocument();
    });

    it('the access row keeps what the event was and drops the ask', () => {
      const { unmount } = render(view(withDetails({ accessOption: 'OPEN' })));
      expect(screen.queryByTestId('event-access')).not.toBeInTheDocument();
      unmount();

      const paid = render(view(withDetails({ accessOption: 'PAID' })));
      expect(screen.getByTestId('event-access')).toHaveTextContent(/^Paid$/);
      paid.unmount();

      render(view(withDetails({ accessOption: 'Invite only' })));
      expect(screen.getByTestId('event-access')).toHaveTextContent('Invite onlyThe hosts approve each guest');
    });

    it("the event's own page stays as a link", () => {
      render(view());
      expect(within(screen.getByTestId('event-link-row')).getByRole('link')).toHaveAttribute(
        'href',
        'https://labweek.test/',
      );
    });
  });

  describe('signed out', () => {
    it('shows the count, which starts sign-in as today, and no "Yes"', () => {
      const onSignIn = jest.fn();
      render(view({ ...SIGNED_OUT, onSignIn }));
      expectNoRsvp();
      fireEvent.click(within(card()).getByRole('button', { name: '40 members went' }));
      expect(onSignIn).toHaveBeenCalledTimes(1);
      expect(screen.queryByTestId('event-attendees')).not.toBeInTheDocument();
    });

    it('nobody went to an event that is not invite-only: says so', () => {
      for (const props of [{ ...SIGNED_OUT, onSignIn: jest.fn() }, EMBED]) {
        const { unmount } = render(view({ ...props, raw: { goingCount: 0, faces: [] } }));
        expect(within(card()).getByText('Nobody said they were going.')).toBeInTheDocument();
        unmount();
      }
    });

    const details = (accessOption: string | null) => ({ ...eventResponse().details!, accessOption });
    // The backend sends the real count and faces for an invite-only access without the type, and 0 for the type.
    const INVITE_ONLY: [string, Partial<EventDetailResponse>][] = [
      ['access INVITE and no type, with people', { type: null, details: details('INVITE'), goingCount: 12 }],
      ['type INVITE_ONLY, without people', { type: 'INVITE_ONLY', details: details(null), goingCount: 0, faces: [] }],
      ['type INVITE_ONLY and access OPEN', { type: 'INVITE_ONLY', details: details('OPEN'), goingCount: 0, faces: [] }],
      [
        'type INVITE_ONLY and access PAID, with people',
        { type: 'INVITE_ONLY', details: details('PAID'), goingCount: 12 },
      ],
    ];

    it.each(INVITE_ONLY)('invite only (%s): no count, no faces, nothing to press, here and in the embed', (_, raw) => {
      for (const props of [{ ...SIGNED_OUT, onSignIn: jest.fn() }, EMBED]) {
        const { unmount } = render(view({ ...props, raw }));
        expect(card()).toHaveTextContent(/^This event has ended$/);
        expect(card().querySelector('img')).toBeNull();
        expect(within(card()).queryByRole('button')).not.toBeInTheDocument();
        unmount();
      }
    });

    it('a member sees who went to an invite-only event', () => {
      const { unmount } = render(view({ raw: INVITE_ONLY[0][1] }));
      expect(within(card()).getByRole('button', { name: '12 members went' })).toBeInTheDocument();
      unmount();
      render(view({ raw: INVITE_ONLY[1][1] }));
      expect(within(card()).getByText('Nobody said they were going.')).toBeInTheDocument();
    });
  });

  it('the embed shows the same card, the count as text and no "RSVP on LabOS"', () => {
    render(view(EMBED));
    expect(within(card()).getByText('This event has ended')).toBeInTheDocument();
    expect(within(card()).getByText('40 members went')).toBeInTheDocument();
    expect(within(card()).queryByRole('button')).not.toBeInTheDocument();
    expect(within(card()).queryByRole('link')).not.toBeInTheDocument();
    expectNoRsvp();
  });

  it('opens on the event when asked for the plans ("Edit details")', () => {
    render(view({ raw: GOING, plans: GOING_PLANS, initialStep: 'plans' }));
    expect(within(card()).getByText('You went')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Save' })).not.toBeInTheDocument();
    expectNoRsvp();
  });

  describe('it ends while the drawer is open', () => {
    // Not a round number of 30-second looks at the clock, so only a timer set for the end is on time.
    const LEFT = 2 * HOUR + 7 * SECOND;
    beforeEach(() => jest.setSystemTime(END - LEFT));

    it('the card turns to the ended state at the end, and not before', () => {
      render(view());
      passTime(LEFT - SECOND);
      expect(screen.getByText('Are you going?')).toBeInTheDocument();
      passTime(SECOND);
      expect(within(card()).getByText('This event has ended')).toBeInTheDocument();
      expectNoRsvp();
    });

    it('a member who said yes in this drawer then went', async () => {
      render(view());
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: "Yes, I'm going" }));
      });
      passTime(LEFT);
      expect(within(card()).getByText('You went')).toBeInTheDocument();
      expect(within(card()).getByRole('button', { name: 'You and 40 members' })).toBeInTheDocument();
    });

    // The clock is past the end, but the drawer has not looked at it yet (a computer that slept).
    const sleepPastTheEnd = () => jest.setSystemTime(END + SECOND);

    it('"Yes, I\'m going" pressed after the end saves nothing', async () => {
      const onYes = jest.fn(async () => true);
      render(view({ onYes }));
      const yes = screen.getByRole('button', { name: "Yes, I'm going" });
      sleepPastTheEnd();
      await act(async () => {
        fireEvent.click(yes);
      });
      expect(onYes).not.toHaveBeenCalled();
      // At once: no timer has run.
      expect(within(card()).getByText('This event has ended')).toBeInTheDocument();
    });

    it('"Mark as not going" pressed after the end saves nothing', async () => {
      const onNotGoing = jest.fn(async () => true);
      render(view({ raw: GOING, plans: GOING_PLANS, onNotGoing }));
      const notGoing = screen.getByRole('button', { name: 'Mark as not going' });
      sleepPastTheEnd();
      await act(async () => {
        fireEvent.click(notGoing);
      });
      expect(onNotGoing).not.toHaveBeenCalled();
      expect(within(card()).getByText('You went')).toBeInTheDocument();
    });

    it('Save in the plans pressed after the end saves nothing', async () => {
      const onSave = jest.fn(async () => true);
      render(view({ raw: GOING, plans: GOING_PLANS, initialStep: 'plans', onSave }));
      const save = screen.getByRole('button', { name: 'Save' });
      sleepPastTheEnd();
      await act(async () => {
        fireEvent.click(save);
      });
      expect(onSave).not.toHaveBeenCalled();
      expect(within(card()).getByText('You went')).toBeInTheDocument();
    });

    it('coming back to the tab after the end shows the ended state at once', () => {
      render(view());
      sleepPastTheEnd();
      act(() => void document.dispatchEvent(new Event('visibilitychange')));
      expect(card()).toBeInTheDocument();
    });

    it('open plans, and a picker over them, give way to the event', () => {
      render(view({ raw: GOING, plans: GOING_PLANS, initialStep: 'plans' }));
      fireEvent.click(screen.getAllByText('Select date range')[0].closest('button') as HTMLElement);
      expect(screen.getByRole('button', { name: 'Apply' })).toBeInTheDocument();
      passTime(LEFT);
      expect(within(card()).getByText('You went')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Save' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Apply' })).not.toBeInTheDocument();
    });

    it('the plans do not open again by themselves when the end moves later', () => {
      const props: Props = { plans: GOING_PLANS, initialStep: 'plans' };
      const { rerender } = render(view({ ...props, raw: GOING }));
      expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
      passTime(LEFT);
      expect(card()).toBeInTheDocument();
      rerender(view({ ...props, raw: { ...GOING, endDate: '2030-12-05T20:00:00.000Z' } }));
      expect(screen.getByText("You're going")).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Save' })).not.toBeInTheDocument();
    });

    /** Lays the going card out below the drawer's screen, so the pinned bar shows. */
    const scrollCardAway = () =>
      jest.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
        const isCard = (this as HTMLElement).firstElementChild?.getAttribute('data-testid') === 'rsvp-card';
        const box = isCard ? { top: 900, height: 200 } : { top: 0, height: 800 };
        return { ...box, bottom: box.top + box.height, left: 0, right: 640, width: 640, x: 0, y: box.top } as DOMRect;
      });

    it.each(['rsvp-card', 'rsvp-bar'])('signed out, a "Yes" press in %s after the end opens no sign-in', (place) => {
      const spy = scrollCardAway();
      try {
        const onSignIn = jest.fn();
        render(view({ ...SIGNED_OUT, onSignIn }));
        const yes = within(screen.getByTestId(place)).getByRole('button', { name: "Yes, I'm going" });
        fireEvent.click(yes);
        expect(onSignIn).toHaveBeenCalledTimes(1);

        sleepPastTheEnd();
        fireEvent.click(yes);
        expect(onSignIn).toHaveBeenCalledTimes(1);
        // At once: no timer has run.
        expect(within(card()).getByText('This event has ended')).toBeInTheDocument();
        expectNoRsvp();
      } finally {
        spy.mockRestore();
      }
    });

    it('the pinned bar goes away', () => {
      const spy = scrollCardAway();
      try {
        render(view());
        expect(screen.getByTestId('rsvp-bar')).toBeInTheDocument();
        passTime(LEFT);
        expect(screen.queryByTestId('rsvp-bar')).not.toBeInTheDocument();
      } finally {
        spy.mockRestore();
      }
    });

    it('in the embed, "RSVP on LabOS" goes away', () => {
      render(view(EMBED));
      expect(screen.getByRole('link', { name: /RSVP on LabOS/ })).toBeInTheDocument();
      passTime(LEFT);
      expectNoRsvp();
    });
  });

  it('an end that moved later, after a refetch, asks again', () => {
    const { rerender } = render(view());
    expect(card()).toBeInTheDocument();
    rerender(view({ raw: { endDate: '2030-12-05T20:00:00.000Z' } }));
    expect(screen.getByText('Are you going?')).toBeInTheDocument();
    passTime(2 * HOUR);
    expect(card()).toBeInTheDocument();
  });
});
