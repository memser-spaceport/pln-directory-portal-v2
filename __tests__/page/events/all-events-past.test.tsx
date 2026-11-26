import React from 'react';
import '@testing-library/jest-dom';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { hydrateRoot } from 'react-dom/client';

import { EventRows } from '@/components/page/events/all-events/map/EventRows';
import { AllEventsPage, type AllEventsPageProps } from '@/components/page/events/all-events/AllEventsPage';
import { useAllEventsFilterStore } from '@/services/events/all-events-filters.store';
import { pastLandingQuery } from '@/services/events/all-events.filters';
import { allEventsItem as item } from '@/services/events/all-events.fixtures';
import type { AllEventsItem } from '@/services/events/all-events.types';

// The Node build, which the server runs; jsdom would resolve the browser build, which needs MessageChannel.
const { renderToString } = require('react-dom/server.node');

/* LAB-3418: past events on the All Events page: Live & upcoming | Past, the Past list, its year, Calendar and the embed. */

jest.mock('@/utils/events-page', () => ({
  SHOW_EVENTS_PAGE_V2: true,
  HAS_EVENTS_MAP: true,
  GOOGLE_MAPS_API_KEY: 'test-key',
  GOOGLE_MAPS_MAP_ID: 'test-map-id',
}));
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), prefetch: jest.fn(), refresh: jest.fn() }),
  usePathname: () => '/events/all',
  useSearchParams: () => new URLSearchParams(window.location.search),
}));

type DrawerProps = {
  eventUid: string | null;
  sequence?: string[];
  initialStep?: string;
  onClose: () => void;
  onNavigate?: (uid: string) => void;
};
jest.mock(
  'next/dynamic',
  () => () =>
    function EventDrawerStandIn(props: DrawerProps) {
      if (!props.eventUid) return null;
      return (
        <div
          data-testid="event-drawer"
          data-uid={props.eventUid}
          data-sequence={(props.sequence ?? []).join(',')}
          data-step={props.initialStep ?? 'event'}
        >
          <button type="button" onClick={props.onClose}>
            Close drawer
          </button>
          <button
            type="button"
            onClick={() => {
              const list = props.sequence ?? [];
              props.onNavigate?.(list[list.indexOf(props.eventUid as string) + 1]);
            }}
          >
            Next event
          </button>
        </div>
      );
    },
);
jest.mock('@/components/page/events/EventDrawer/EventDrawer', () => ({ EventDrawer: () => null }));

const analytics = {
  onEventsViewChanged: jest.fn(),
  onEventsWhenChanged: jest.fn(),
  onEventsYearChanged: jest.fn(),
  onEventsFiltersApplied: jest.fn(),
  onEventsCitySelected: jest.fn(),
  onSubmitEventButtonClicked: jest.fn(),
  onEventsEmbedLinkCopied: jest.fn(),
  onEventsEmbedCodeCopied: jest.fn(),
  onEventsEmbedViewed: jest.fn(),
};
jest.mock('@/analytics/events.analytics', () => ({ useEventsAnalytics: () => analytics }));

const going = { uids: [] as string[] };
jest.mock('@/services/events/hooks/useMyUpcomingEventUids', () => ({
  useMyUpcomingEventUids: (enabled: boolean) => ({ data: enabled ? going.uids : undefined }),
}));

type Query<T> = {
  data: T | undefined;
  isError: boolean;
  isFetching: boolean;
  /** 'idle' with no data and no error: the query is switched off. */
  fetchStatus?: 'fetching' | 'idle';
  refetch: jest.Mock;
};
const query = <T,>(over: Partial<Query<T>> = {}): Query<T> => ({
  data: undefined,
  isError: false,
  isFetching: false,
  // As React Query has it after a failed load: nothing under way.
  ...(over.isError && !over.isFetching ? { fetchStatus: 'idle' as const } : {}),
  refetch: jest.fn(),
  ...over,
});
const pastEvents = { state: query<AllEventsItem[]>(), enabled: [] as boolean[] };
jest.mock('@/services/events/hooks/usePastEvents', () => ({
  usePastEvents: (enabled: boolean) => {
    pastEvents.enabled.push(enabled);
    return pastEvents.state;
  },
}));
const went = { state: query<string[]>(), enabled: [] as boolean[] };
jest.mock('@/services/events/hooks/useMyPastEventUids', () => ({
  useMyPastEventUids: (enabled: boolean) => {
    went.enabled.push(enabled);
    return went.state;
  },
}));
jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useQueryClient: () => ({ setQueryData: jest.fn() }),
}));
jest.mock('@/services/events/hooks/useEventDrawerQueries', () => ({ usePrefetchEventDetail: () => jest.fn() }));
// The map has its own suite; here a stand-in says what it was given.
jest.mock('@/components/page/events/all-events/map/EventsMap', () => ({
  EventsMap: (props: { events: AllEventsItem[]; pastAsOf?: string; goingUids: Set<string> }) => (
    <div
      data-testid="events-map"
      data-events={props.events.map((e) => e.uid).join(',')}
      data-past-as-of={String(props.pastAsOf)}
      data-going={Array.from(props.goingUids).join(',')}
    />
  ),
}));
jest.mock('@/components/core/ToastContainer', () => ({ toast: { success: jest.fn(), error: jest.fn() } }));
// The Calendar's month picker (LAB-3460) is react-calendar, which ships ESM only; its own suite has a stand-in.
jest.mock('react-calendar', () => ({ __esModule: true, default: () => null }));

/** Noon UTC on Nov 25, 2030, whatever zone the tests run in. */
const NOW = Date.UTC(2030, 10, 25, 12);
const TODAY = '2030-11-25';

const on = (uid: string, startDay: string, over: Partial<AllEventsItem> = {}) =>
  item({
    uid,
    name: `Event ${uid}`,
    startDay,
    endDay: startDay,
    startDate: `${startDay}T09:00:00.000Z`,
    endDate: `${startDay}T11:00:00.000Z`,
    ...over,
  });

const upcoming = () => [
  on('now', TODAY, { startDate: `${TODAY}T11:00:00.000Z`, endDate: `${TODAY}T12:00:30.000Z`, goingCount: 5 }),
  on('dec', '2030-12-03', { city: 'Dubai', hosts: ['Upcoming Host'] }),
  on('jan', '2031-01-10', { mode: 'Virtual', city: null, place: null }),
];
const past = () => [
  on('p-nov', '2030-11-12', { goingCount: 1, access: 'INVITE ONLY', hosts: ['Past Host'] }),
  on('p-jan', '2030-01-02', { city: 'Paris', cityKey: 'paris', place: 'Paris, France', goingCount: 12, zone: 'UTC+1' }),
  on('p-newyear', '2029-12-30', { endDay: '2030-01-03', endDate: '2030-01-03T18:00:00.000Z', city: 'Paris' }),
  on('p-dec', '2029-12-30', {
    startDate: '2029-12-30T08:00:00.000Z',
    mode: 'Virtual',
    city: null,
    place: null,
    goingCount: null,
  }),
];
const NEWEST_FIRST = ['p-nov', 'p-jan', 'p-newyear', 'p-dec'];

function renderPage(over: Partial<AllEventsPageProps> = {}, url = '/events/all') {
  window.history.replaceState(null, '', url);
  return render(
    <AllEventsPage
      result={{ ok: true, items: upcoming() }}
      signedIn={false}
      viewerUid={null}
      memberCity={undefined}
      serverNow={Date.now()}
      serverTodayIso={TODAY}
      submitHref="https://irl.example/submit"
      {...over}
    />,
  );
}
const MEMBER = { signedIn: true, viewerUid: 'm1', memberCity: 'Lisbon' };
const PAST = '/events/all?when=past';

const storeParams = () => useAllEventsFilterStore.getState().params;
const tab = (name: RegExp) => within(screen.getByRole('tablist', { name: 'When' })).getByRole('tab', { name });
const liveTab = () => tab(/^Live & upcoming/);
const pastTab = () => tab(/^Past/);
const tabTexts = () => [liveTab(), pastTab()].map((el) => el.textContent?.trim());
/** The events of the list, in order. */
const listed = () =>
  Array.from(document.querySelectorAll('ol [data-event-uid]')).map((el) => el.getAttribute('data-event-uid'));
const card = (uid: string) => document.querySelector(`[data-event-uid="${uid}"]`) as HTMLElement;
const headings = () => Array.from(document.querySelectorAll('ol h3')).map((el) => el.textContent);
const filtersDoor = () => document.querySelector('[aria-controls="events-filters"]') as HTMLElement;
const rail = () => document.getElementById('events-filters') as HTMLElement;
const yearPicker = () => screen.queryByRole('button', { name: /^Year: / });
async function pickYear(name: string) {
  fireEvent.click(yearPicker() as HTMLElement);
  await act(async () => void jest.advanceTimersByTime(100));
  fireEvent.click(screen.getByRole('menuitem', { name }));
  await act(async () => void jest.advanceTimersByTime(500));
}
const yearOptions = async () => {
  fireEvent.click(yearPicker() as HTMLElement);
  await act(async () => void jest.advanceTimersByTime(100));
  return screen.getAllByRole('menuitem').map((el) => el.textContent);
};

beforeEach(() => {
  jest.useFakeTimers({ now: NOW });
  useAllEventsFilterStore.setState({ params: new URLSearchParams(), _clearImmediate: false });
  going.uids = [];
  pastEvents.state = query({ data: past() });
  pastEvents.enabled = [];
  went.state = query({ data: [] as string[] });
  went.enabled = [];
  jest.clearAllMocks();
});
afterEach(() => {
  act(() => jest.runOnlyPendingTimers());
  jest.useRealTimers();
});

describe('the When switch', () => {
  it('takes the place of "Coming up" in List and Map, with a count in each tab', () => {
    renderPage();
    expect(screen.queryByRole('heading', { name: /^Coming up/ })).toBeNull();
    expect(tabTexts()).toEqual(['Live & upcoming 3', 'Past 4']);
    expect(liveTab()).toHaveAttribute('aria-selected', 'true');
    expect(pastTab()).toHaveAttribute('aria-selected', 'false');
    fireEvent.click(screen.getByRole('tab', { name: 'Map' }));
    expect(tabTexts()).toEqual(['Live & upcoming 3', 'Past 4']);
  });

  it('Calendar has the same tabs and counts, and no year, also with `when=past&year=` in the address (LAB-3460)', () => {
    renderPage({}, '/events/all?when=past&year=2029&view=calendar');
    expect(screen.queryByRole('heading', { name: /^Coming up/ })).toBeNull();
    expect(tabTexts()).toEqual(['Live & upcoming 3', 'Past 4']);
    // `when` means nothing in Calendar: the tab is this month's.
    expect(liveTab()).toHaveAttribute('aria-selected', 'true');
    expect(yearPicker()).toBeNull();
  });

  it('switches what is under the toolbar, keeps it in the address, and records it', () => {
    renderPage();
    fireEvent.click(pastTab());
    expect(listed()).toEqual(NEWEST_FIRST);
    expect(pastTab()).toHaveAttribute('aria-selected', 'true');
    expect(storeParams().get('when')).toBe('past');
    expect(analytics.onEventsWhenChanged).toHaveBeenLastCalledWith({ when: 'past', view: 'list' });

    fireEvent.click(pastTab());
    expect(analytics.onEventsWhenChanged).toHaveBeenCalledTimes(1);

    fireEvent.click(liveTab());
    expect(listed()).toEqual(['now', 'dec', 'jan']);
    expect(storeParams().has('when')).toBe(false);
    expect(analytics.onEventsWhenChanged).toHaveBeenLastCalledWith({ when: 'upcoming', view: 'list' });
    expect(analytics.onEventsFiltersApplied).not.toHaveBeenCalled();
  });

  it('opens Past from the address', () => {
    renderPage({}, PAST);
    expect(listed()).toEqual(NEWEST_FIRST);
    expect(analytics.onEventsWhenChanged).not.toHaveBeenCalled();
  });

  it('the toolbar’s other controls stay on both tabs', () => {
    renderPage();
    const controls = () =>
      [filtersDoor(), screen.getByRole('tablist', { name: 'View' }), screen.getByRole('button', { name: 'Embed' })].map(
        (el) => el.isConnected,
      );
    expect(controls()).toEqual([true, true, true]);
    fireEvent.click(pastTab());
    expect(controls()).toEqual([true, true, true]);
  });

  it('is two tabs the keyboard reaches', () => {
    renderPage();
    [liveTab(), pastTab()].forEach((el) => {
      el.focus();
      expect(el).toHaveFocus();
      expect(el.tabIndex).toBe(0);
    });
  });

  it('both counts follow the filters, on either tab', () => {
    renderPage({}, '/events/all?city=Paris');
    expect(tabTexts()).toEqual(['Live & upcoming 0', 'Past 2']);
    fireEvent.click(pastTab());
    expect(tabTexts()).toEqual(['Live & upcoming 0', 'Past 2']);
  });

  it('`when` is no applied filter: not counted, and kept by Clear all and Show all events', () => {
    renderPage({}, '/events/all?when=past&mode=Online&city=Paris');
    expect(within(filtersDoor()).getByText('2')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Remove filter past/i })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Show all events' }));
    expect(storeParams().toString()).toBe('when=past');
    expect(listed()).toEqual(NEWEST_FIRST);
  });
});

describe('what is past', () => {
  it('an event leaves Live & upcoming and enters Past at its end instant, with no gap or overlap', () => {
    pastEvents.state = query({ data: [] });
    renderPage();
    act(() => jest.advanceTimersByTime(29_000));
    expect(tabTexts()).toEqual(['Live & upcoming 3', 'Past 0']);
    act(() => jest.advanceTimersByTime(999));
    expect(tabTexts()).toEqual(['Live & upcoming 3', 'Past 0']);
    act(() => jest.advanceTimersByTime(1));
    expect(tabTexts()).toEqual(['Live & upcoming 2', 'Past 1']);
    expect(listed()).toEqual(['dec', 'jan']);
    fireEvent.click(pastTab());
    expect(listed()).toEqual(['now']);
  });

  it('a cached list from before the end shows the event in Past at once', () => {
    jest.setSystemTime(NOW + 60_000);
    renderPage({ serverNow: NOW + 60_000 });
    expect(tabTexts()).toEqual(['Live & upcoming 2', 'Past 5']);
  });

  it('shows an event once when it is in both lists', () => {
    pastEvents.state = query({ data: [...past(), on('now', TODAY)] });
    renderPage();
    expect(tabTexts()).toEqual(['Live & upcoming 3', 'Past 4']);
    act(() => jest.advanceTimersByTime(30_000));
    expect(tabTexts()).toEqual(['Live & upcoming 2', 'Past 5']);
    fireEvent.click(pastTab());
    expect(listed().filter((uid) => uid === 'now')).toHaveLength(1);
  });

  it('Near you, the rail and Browse by city follow: an ended event is not in what is coming up', () => {
    renderPage(MEMBER);
    expect(screen.getByRole('region', { name: 'Near you in Lisbon' })).toBeInTheDocument();
    const cities = () => screen.getByRole('region', { name: 'Browse by city' });
    expect(within(cities()).getByRole('button', { name: /^Lisbon/ })).toBeInTheDocument();
    act(() => jest.advanceTimersByTime(30_000));
    expect(within(cities()).queryByRole('button', { name: /^Lisbon/ })).toBeNull();
    expect(screen.queryByRole('region', { name: /^Near you/ })).toBeNull();
    expect(screen.getByText(/No upcoming events/)).toBeInTheDocument();
  });

  describe('an event that has begun is in one of the two tabs, whichever list loads or goes stale', () => {
    const page = (items: AllEventsItem[]) => (
      <AllEventsPage
        result={{ ok: true, items }}
        signedIn={false}
        viewerUid={null}
        memberCity={undefined}
        serverNow={NOW}
        serverTodayIso={TODAY}
        submitHref="https://irl.example/submit"
      />
    );
    /** Which tab lists the event, and how many times. */
    const tabsOf = (uid: string) => {
      fireEvent.click(liveTab());
      const live = listed().filter((u) => u === uid).length;
      fireEvent.click(pastTab());
      return { live, past: listed().filter((u) => u === uid).length };
    };
    const [now, dec, jan] = upcoming();

    it('a server list that comes again without an event that has ended', () => {
      const { rerender } = renderPage();
      act(() => jest.advanceTimersByTime(30_000));
      expect(tabsOf('now')).toEqual({ live: 0, past: 1 });
      // The location dialog's refresh; the past list is from before the end.
      rerender(page([dec, jan]));
      expect(tabsOf('now')).toEqual({ live: 0, past: 1 });
    });

    it('coming back to a past list from before an event ended, and a server list from after', () => {
      pastEvents.state = query({ data: [now, ...past()] });
      renderPage({ result: { ok: true, items: [dec, jan] } });
      // The server's clock is ahead: here it has half a minute left.
      expect(tabsOf('now')).toEqual({ live: 1, past: 0 });
      act(() => jest.advanceTimersByTime(30_000));
      expect(tabsOf('now')).toEqual({ live: 0, past: 1 });
    });

    it('an event that starts and ends after both lists loaded', () => {
      const later = on('later', TODAY, {
        startDate: `${TODAY}T13:00:00.000Z`,
        endDate: `${TODAY}T14:00:00.000Z`,
      });
      const { rerender } = renderPage({ result: { ok: true, items: [...upcoming(), later] } });
      expect(tabsOf('later')).toEqual({ live: 1, past: 0 });
      act(() => jest.advanceTimersByTime(3 * 3_600_000));
      expect(tabsOf('later')).toEqual({ live: 0, past: 1 });
      rerender(page([dec, jan]));
      expect(tabsOf('later')).toEqual({ live: 0, past: 1 });

      // Only the past list has it, from the day before its start.
      pastEvents.state = query({
        data: [
          on('route', '2030-11-26', { startDate: '2030-11-26T13:00:00.000Z', endDate: '2030-11-26T14:00:00.000Z' }),
          ...past(),
        ],
      });
      rerender(page([dec, jan]));
      expect(tabsOf('route')).toEqual({ live: 0, past: 0 });
      act(() => jest.advanceTimersByTime(24 * 3_600_000));
      expect(tabsOf('route')).toEqual({ live: 0, past: 1 });
    });

    it('a past list that comes again without an event', () => {
      const { rerender } = renderPage();
      pastEvents.state = query({ data: past().slice(1) });
      rerender(page(upcoming()));
      expect(tabsOf('p-nov')).toEqual({ live: 0, past: 1 });
    });

    it('a past list’s event that has not begun is in neither until it does', () => {
      const soon = on('soon', TODAY, { startDate: `${TODAY}T13:00:00.000Z`, endDate: `${TODAY}T14:00:00.000Z` });
      pastEvents.state = query({ data: [soon, ...past()] });
      renderPage();
      expect(tabsOf('soon')).toEqual({ live: 0, past: 0 });
      expect(tabTexts()).toEqual(['Live & upcoming 3', 'Past 4']);
      act(() => jest.advanceTimersByTime(3_600_000));
      expect(tabsOf('soon')).toEqual({ live: 1, past: 0 });
      act(() => jest.advanceTimersByTime(3_600_000));
      expect(tabsOf('soon')).toEqual({ live: 0, past: 1 });
    });

    describe('the page’s newest list', () => {
      const times = (from: string, to: string, over: Partial<AllEventsItem> = {}) =>
        on('soon', TODAY, { startDate: `${TODAY}T${from}:00.000Z`, endDate: `${TODAY}T${to}:00.000Z`, ...over });

      it('takes off an event it no longer has that has not begun, for good, also with the past list’s copy of it', () => {
        const soon = times('13:00', '14:00');
        pastEvents.state = query({ data: [soon, ...past()] });
        const { rerender } = renderPage({ result: { ok: true, items: [...upcoming(), soon] } });
        expect(tabsOf('soon')).toEqual({ live: 1, past: 0 });
        expect(tabsOf('dec')).toEqual({ live: 1, past: 0 });
        rerender(page([now, jan]));
        ['soon', 'dec'].forEach((uid) => expect(tabsOf(uid)).toEqual({ live: 0, past: 0 }));
        act(() => jest.advanceTimersByTime(3 * 3_600_000));
        expect(tabsOf('soon')).toEqual({ live: 0, past: 0 });
        // It is on again.
        rerender(page([now, jan, times('16:00', '17:00')]));
        expect(tabsOf('soon')).toEqual({ live: 1, past: 0 });
      });

      it('keeps an event cancelled while live until the page is left, then in Past', () => {
        const { rerender, unmount } = renderPage();
        rerender(page([dec, jan]));
        expect(tabsOf('now')).toEqual({ live: 1, past: 0 });
        act(() => jest.advanceTimersByTime(30_000));
        expect(tabsOf('now')).toEqual({ live: 0, past: 1 });
        unmount();
        renderPage({ result: { ok: true, items: [dec, jan] } });
        expect(tabsOf('now')).toEqual({ live: 0, past: 0 });
      });

      it('shows an event that has moved at its new dates', () => {
        pastEvents.state = query({ data: [on('dec', '2030-12-03'), ...past()] });
        const { rerender } = renderPage();
        rerender(page([now, jan, on('dec', '2031-02-20', { name: 'Moved' })]));
        fireEvent.click(liveTab());
        expect(card('dec')).toHaveTextContent('Moved');
        expect(listed()).toEqual(['now', 'jan', 'dec']);
      });

      it('wins over the past list, which can be the older copy, whichever came first', () => {
        // The past list still has the old hours, at which it would be over.
        pastEvents.state = query({ data: [times('09:00', '10:00'), ...past()] });
        const items = [now, times('13:00', '14:00', { name: 'New hours' })];
        const { rerender } = renderPage({ result: { ok: true, items } });
        expect(tabsOf('soon')).toEqual({ live: 1, past: 0 });
        pastEvents.state = query({ data: [times('08:00', '10:00'), ...past()] });
        rerender(page(items));
        expect(tabsOf('soon')).toEqual({ live: 1, past: 0 });
        fireEvent.click(liveTab());
        expect(card('soon')).toHaveTextContent('New hours');
      });

      it('gives way, once it has dropped a live event, to a past list that came later', () => {
        pastEvents.state = query({ isFetching: true });
        const items = [times('11:00', '18:00'), dec];
        const { rerender } = renderPage({ result: { ok: true, items } });
        // It was cut short.
        pastEvents.state = query({ data: [times('11:00', '11:30', { name: 'Cut short' }), ...past()] });
        rerender(page(items));
        expect(tabsOf('soon')).toEqual({ live: 1, past: 0 });
        rerender(page([dec]));
        expect(tabsOf('soon')).toEqual({ live: 0, past: 1 });
        expect(card('soon')).toHaveTextContent('Cut short');
      });

      it('keeps an event that has ended in Past, also when a past list that came later has it live', () => {
        const { rerender } = renderPage();
        act(() => jest.advanceTimersByTime(30_000));
        rerender(page([dec, jan]));
        expect(tabsOf('now')).toEqual({ live: 0, past: 1 });
        pastEvents.state = query({ data: [{ ...now, endDate: `${TODAY}T18:00:00.000Z` }, ...past()] });
        rerender(page([dec, jan]));
        expect(tabsOf('now')).toEqual({ live: 0, past: 1 });
      });

      it('does not give way to a past list from before it', () => {
        pastEvents.state = query({ data: [times('11:00', '11:30'), ...past()] });
        const { rerender } = renderPage({ result: { ok: true, items: [times('11:00', '18:00'), dec] } });
        rerender(page([dec]));
        expect(tabsOf('soon')).toEqual({ live: 1, past: 0 });
      });

      it('has the last word on a live event too', () => {
        const { rerender } = renderPage();
        rerender(page([{ ...now, name: 'Runs on', endDate: `${TODAY}T12:05:00.000Z` }, dec, jan]));
        act(() => jest.advanceTimersByTime(30_000));
        expect(tabsOf('now')).toEqual({ live: 1, past: 0 });
        fireEvent.click(liveTab());
        expect(card('now')).toHaveTextContent('Runs on');
      });

      it('is not undone by a past list that says a live event has yet to start', () => {
        const { rerender } = renderPage();
        pastEvents.state = query({ data: [on('now', '2030-11-26'), ...past()] });
        rerender(page(upcoming()));
        rerender(page([dec, jan]));
        expect(tabsOf('now')).toEqual({ live: 1, past: 0 });
        // And one that comes after the page's list has dropped it.
        pastEvents.state = query({ data: [on('now', '2030-11-27'), ...past()] });
        rerender(page([dec, jan]));
        expect(tabsOf('now')).toEqual({ live: 1, past: 0 });
        act(() => jest.advanceTimersByTime(30_000));
        expect(tabsOf('now')).toEqual({ live: 0, past: 1 });
      });
    });
  });
});

describe('loading past events', () => {
  it('waits for the page, then asks once, also when Past is not shown', () => {
    renderPage();
    expect(new Set(pastEvents.enabled)).toEqual(new Set([true]));
  });

  it('while it loads: Live as ever, no count on Past yet but its room kept, and a skeleton under it', () => {
    pastEvents.state = query({ isFetching: true });
    renderPage();
    expect(listed()).toEqual(['now', 'dec', 'jan']);
    expect(tabTexts()).toEqual(['Live & upcoming 3', 'Past']);
    expect(pastTab().querySelector('[class*="scopeSlot"]')).not.toBeNull();
    fireEvent.click(pastTab());
    expect(screen.getByLabelText('Loading events')).toBeInTheDocument();
    expect(yearPicker()).toBeNull();
  });

  it('the count takes its own room, not the one that was kept', () => {
    pastEvents.state = query({ isFetching: true });
    const props = { result: { ok: true as const, items: upcoming() } };
    const { rerender } = renderPage(props);
    pastEvents.state = query({ data: past() });
    rerender(
      <AllEventsPage
        {...props}
        signedIn={false}
        viewerUid={null}
        memberCity={undefined}
        serverNow={NOW}
        serverTodayIso={TODAY}
        submitHref="https://irl.example/submit"
      />,
    );
    expect(pastTab().querySelector('[class*="scopeCount"]')).toHaveTextContent(/^4$/);
    expect(pastTab().querySelector('[class*="scopeSlot"]')).toBeNull();
  });

  it('when it fails: Live as ever, no badge on Past but its room kept, and the error with a retry under it', () => {
    pastEvents.state = query({ isError: true });
    renderPage({}, '/events/all?city=Lisbon');
    expect(listed()).toEqual(['now']);
    expect(tabTexts()).toEqual(['Live & upcoming 1', 'Past']);
    expect(pastTab().querySelector('[class*="scopeCount"]')).toBeNull();
    expect(pastTab().querySelector('[class*="scopeSlot"]')).not.toBeNull();
    fireEvent.click(pastTab());
    expect(screen.getByText("Events couldn't load")).toBeInTheDocument();
    // No city header there, so the city is a chip.
    expect(screen.queryByRole('heading', { name: 'Lisbon' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Remove filter Lisbon' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(pastEvents.state.refetch).toHaveBeenCalledTimes(1);
  });

  it('a retry under way shows the skeleton, not the error', () => {
    pastEvents.state = query({ isError: true, isFetching: true });
    renderPage({}, PAST);
    expect(screen.queryByText("Events couldn't load")).toBeNull();
    expect(screen.getByLabelText('Loading events')).toBeInTheDocument();
  });

  it('when it fails, Calendar works with the upcoming events', () => {
    pastEvents.state = query({ isError: true });
    renderPage({}, '/events/all?view=calendar&cal=month');
    expect(card('now')).not.toBeNull();
    expect(screen.queryByText("Events couldn't load")).toBeNull();
  });

  it('asks for nothing when the page itself failed', () => {
    renderPage({ result: { ok: false } });
    expect(new Set(pastEvents.enabled)).toEqual(new Set([false]));
  });
});

describe('the Past list', () => {
  it('runs newest first, each event under its first day, with the year outside the current one', () => {
    renderPage({}, PAST);
    expect(headings()).toEqual(['Nov 12Tuesday', 'Jan 2Wednesday', 'Dec 30, 2029Sunday']);
    expect(listed()).toEqual(NEWEST_FIRST);
    expect(within(card('p-newyear')).getByText('9:00 AM UTC+0 · Day 1 of 5')).toBeInTheDocument();
  });

  it('has no Near you, Add location, Browse by city or list heading', () => {
    renderPage(MEMBER, PAST);
    expect(screen.queryByRole('region', { name: /Near you/ })).toBeNull();
    expect(screen.queryByRole('region', { name: 'Browse by city' })).toBeNull();
    expect(screen.queryByText('All live & upcoming')).toBeNull();
    fireEvent.click(liveTab());
    expect(screen.getByRole('region', { name: 'Near you in Lisbon' })).toBeInTheDocument();
    expect(screen.getByText('All live & upcoming')).toBeInTheDocument();
  });

  it('asks a member with no location for none on Past', () => {
    renderPage({ ...MEMBER, memberCity: null }, PAST);
    expect(screen.queryByText('See events near you.')).toBeNull();
  });

  it('a chosen city keeps its header: "N past events" and their span with years; no zone when its events differ', () => {
    renderPage({}, '/events/all?when=past&city=Paris');
    // p-jan is in UTC+1, p-newyear in UTC+0: no one "Times in" would be true for both cards (P13).
    expect(screen.getByText('2 past events · Dec 30, 2029 – Jan 3, 2030')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'All cities' }));
    expect(storeParams().toString()).toBe('when=past');
  });

  it('a city whose events share one zone says it (P13)', () => {
    // Only p-jan, in UTC+1, matches.
    renderPage({}, '/events/all?when=past&city=Paris&search=p-jan');
    expect(screen.getByText('1 past event · Jan 2 · Times in Paris time (UTC+1)')).toBeInTheDocument();
  });

  it('one past event in a city reads "1 past event"', () => {
    renderPage({}, '/events/all?when=past&city=Lisbon');
    expect(screen.getByText(/^1 past event · Nov 12 · /)).toBeInTheDocument();
  });

  it('cards read "N went", with no access note, no Live pill, and no count when attendance is hidden', () => {
    renderPage({}, PAST);
    expect(within(card('p-jan')).getByText('12 went')).toBeInTheDocument();
    expect(within(card('p-nov')).getByText('1 went')).toBeInTheDocument();
    expect(within(card('p-nov')).queryByText('Invite only')).toBeNull();
    expect(card('p-dec').textContent).not.toMatch(/went/);
    expect(document.querySelector('ol')?.textContent).not.toMatch(/going|Live/);
  });

  describe('who went (P1)', () => {
    const people = (uid: string) => within(card(uid)).queryByRole('button', { name: /^See who went/ });
    const drawer = () => screen.queryByTestId('event-drawer');

    it('a Past card’s faces and count open the drawer on who went; the rest of the card on the event', () => {
      renderPage(MEMBER, PAST);
      expect(people('p-jan')).toHaveAccessibleName('See who went: 12 people');
      expect(people('p-nov')).toHaveAccessibleName('See who went: 1 person');
      fireEvent.click(people('p-jan') as HTMLElement);
      expect(drawer()).toHaveAttribute('data-uid', 'p-jan');
      expect(drawer()).toHaveAttribute('data-step', 'attendees');
      expect(storeParams().get('event')).toBe('p-jan');
      fireEvent.click(screen.getByRole('button', { name: 'Close drawer' }));
      fireEvent.click(card('p-jan'));
      expect(drawer()).toHaveAttribute('data-step', 'event');
    });

    it('opens from the keyboard, Enter or Space', () => {
      renderPage(MEMBER, PAST);
      fireEvent.keyDown(people('p-nov') as HTMLElement, { key: 'Enter' });
      expect(drawer()).toHaveAttribute('data-step', 'attendees');
      fireEvent.click(screen.getByRole('button', { name: 'Close drawer' }));
      fireEvent.keyDown(people('p-jan') as HTMLElement, { key: ' ' });
      expect(drawer()).toHaveAttribute('data-uid', 'p-jan');
    });

    it('Back to the event after closing it opens it on the event, not on who went', () => {
      renderPage(MEMBER, PAST);
      fireEvent.click(people('p-jan') as HTMLElement);
      fireEvent.click(screen.getByRole('button', { name: 'Close drawer' }));
      expect(drawer()).toBeNull();
      window.history.replaceState(null, '', `${PAST}&event=p-jan`);
      act(() => void window.dispatchEvent(new PopStateEvent('popstate')));
      expect(drawer()).toHaveAttribute('data-uid', 'p-jan');
      expect(drawer()).toHaveAttribute('data-step', 'event');
    });

    it('previous / next from there open the next event on the event, not on who went', () => {
      renderPage(MEMBER, PAST);
      fireEvent.click(people('p-jan') as HTMLElement);
      expect(drawer()).toHaveAttribute('data-step', 'attendees');
      const sequence = (drawer()?.getAttribute('data-sequence') ?? '').split(',');
      const next = sequence[sequence.indexOf('p-jan') + 1];
      fireEvent.click(screen.getByRole('button', { name: 'Next event' }));
      expect(drawer()).toHaveAttribute('data-uid', next);
      expect(drawer()).toHaveAttribute('data-step', 'event');
    });

    it('Live & upcoming cards keep their faces as part of the card', () => {
      going.uids = [];
      renderPage(MEMBER);
      // The List card, not its Near you tile.
      const listCard = document.querySelector('ol [data-event-uid="now"]') as HTMLElement;
      expect(within(listCard).getByText('5 going')).toBeInTheDocument();
      expect(within(listCard).queryByRole('button')).toBeNull();
      fireEvent.click(within(listCard).getByText('5 going'));
      expect(drawer()).toHaveAttribute('data-step', 'event');
    });

    it('signed out, who went needs a sign-in: the faces stay the card’s', () => {
      renderPage({}, PAST);
      expect(people('p-jan')).toBeNull();
      fireEvent.click(within(card('p-jan')).getByText('12 went'));
      expect(drawer()).toHaveAttribute('data-step', 'event');
    });
  });

  it('says so when nothing matches, and offers every past event', () => {
    renderPage({}, '/events/all?when=past&search=zzz');
    expect(screen.getByText('No past events match')).toBeInTheDocument();
    expect(screen.getByText('Try another search or filter, or see every past event.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Show all events' }));
    expect(listed()).toEqual(NEWEST_FIRST);
  });

  it('the rail takes its options from past events', () => {
    renderPage({}, '/events/all?when=past&host=Past Host');
    fireEvent.click(filtersDoor());
    expect(within(rail()).getByText('Paris')).toBeInTheDocument();
    expect(within(rail()).queryByText('Dubai')).toBeNull();
    fireEvent.click(liveTab());
    expect(within(rail()).getByText('Dubai')).toBeInTheDocument();
    expect(within(rail()).queryByText('Paris')).toBeNull();
  });

  it('hands the drawer the Past order', () => {
    renderPage({}, PAST);
    fireEvent.click(card('p-jan'));
    expect(screen.getByTestId('event-drawer')).toHaveAttribute('data-sequence', NEWEST_FIRST.join(','));
  });

  it('scrolls to a linked event once past events have come', () => {
    const scroll = jest.fn();
    Element.prototype.scrollIntoView = scroll;
    const offsetParent = jest.spyOn(HTMLElement.prototype, 'offsetParent', 'get').mockReturnValue(document.body);
    pastEvents.state = query({ isFetching: true });
    const { rerender } = renderPage({}, '/events/all?when=past&event=p-jan');
    act(() => jest.advanceTimersByTime(1000));
    expect(scroll).not.toHaveBeenCalled();
    pastEvents.state = query({ data: past() });
    rerender(
      <AllEventsPage
        result={{ ok: true, items: upcoming() }}
        signedIn={false}
        viewerUid={null}
        memberCity={undefined}
        serverNow={NOW}
        serverTodayIso={TODAY}
        submitHref="https://irl.example/submit"
      />,
    );
    act(() => jest.advanceTimersByTime(300));
    expect(scroll.mock.contexts).toEqual([card('p-jan')]);
    offsetParent.mockRestore();
  });

  it('the Map gets the past events, newest first, with today for their years', () => {
    renderPage(MEMBER, '/events/all?when=past&view=map');
    const map = screen.getByTestId('events-map');
    expect(map).toHaveAttribute('data-events', NEWEST_FIRST.join(','));
    expect(map).toHaveAttribute('data-past-as-of', TODAY);
    fireEvent.click(liveTab());
    expect(screen.getByTestId('events-map')).toHaveAttribute('data-events', 'now,dec,jan');
    expect(screen.getByTestId('events-map')).toHaveAttribute('data-past-as-of', 'undefined');
    expect(analytics.onEventsWhenChanged).toHaveBeenLastCalledWith({ when: 'upcoming', view: 'map' });
  });

  it('the Map says so when nothing matches', () => {
    renderPage({}, '/events/all?when=past&view=map&search=zzz');
    expect(screen.getByText('No past events match')).toBeInTheDocument();
  });
});

describe('"Went"', () => {
  it('marks the past events the viewer went to, and asks which only once Past is shown', () => {
    went.state = query({ data: ['p-jan'] });
    renderPage(MEMBER);
    expect(went.enabled).not.toContain(true);
    fireEvent.click(pastTab());
    expect(went.enabled).toContain(true);
    expect(within(card('p-jan')).getByText('Went')).toBeInTheDocument();
    expect(screen.getAllByText('Went')).toHaveLength(1);
    expect(screen.queryByText('Going')).toBeNull();
  });

  it('never asks signed out, nor in the embed', () => {
    renderPage({}, PAST).unmount();
    renderPage({ embed: true }, '/events/embed?when=past');
    expect(went.enabled).not.toContain(true);
    expect(screen.queryByText('Went')).toBeNull();
  });

  it('an event the viewer is going to reads Going, then Went once it has ended, and its count stays as loaded', () => {
    going.uids = [];
    const props = { ...MEMBER, result: { ok: true as const, items: upcoming() }, serverNow: NOW };
    const page = () => <AllEventsPage {...props} serverTodayIso={TODAY} submitHref="https://irl.example/submit" />;
    const { rerender } = renderPage(props);
    going.uids = ['now'];
    rerender(page());
    expect(within(card('now')).getByText('Going')).toBeInTheDocument();
    expect(within(card('now')).getByText('6 going')).toBeInTheDocument();
    act(() => jest.advanceTimersByTime(30_000));
    fireEvent.click(pastTab());
    expect(within(card('now')).getByText('Went')).toBeInTheDocument();
    expect(within(card('now')).getByText('5 went')).toBeInTheDocument();
  });

  it('"Events I went to" on Past shows the events the viewer went to, and counts them in the rail', () => {
    went.state = query({ data: ['p-jan', 'p-dec'] });
    renderPage(MEMBER, '/events/all?when=past&going=true');
    expect(listed()).toEqual(['p-jan', 'p-dec']);
    expect(tabTexts()[1]).toBe('Past 2');
    fireEvent.click(filtersDoor());
    expect(within(rail()).getByText('Events I went to (2)')).toBeInTheDocument();
    expect(within(rail()).queryByText(/Events I'm going to/)).toBeNull();
  });

  it('the filter reads in the tab’s tense: its chip too, and the address keeps `going`', () => {
    went.state = query({ data: ['p-jan', 'p-dec'] });
    going.uids = ['dec'];
    renderPage(MEMBER, '/events/all?when=past&going=true');
    const chips = () => screen.getByLabelText('Applied filters');
    expect(within(chips()).getByRole('button', { name: 'Remove filter Events I went to' })).toBeInTheDocument();
    fireEvent.click(liveTab());
    expect(within(chips()).getByRole('button', { name: "Remove filter Events I'm going to" })).toBeInTheDocument();
    fireEvent.click(filtersDoor());
    expect(within(rail()).getByText("Events I'm going to (1)")).toBeInTheDocument();
    fireEvent.click(pastTab());
    expect(within(rail()).getByText('Events I went to (2)')).toBeInTheDocument();
    expect(storeParams().get('going')).toBe('true');
    fireEvent.click(within(chips()).getByRole('button', { name: 'Remove filter Events I went to' }));
    expect(storeParams().has('going')).toBe(false);
  });

  it('under that filter, Past waits for which they are, and a failure offers a retry of that', () => {
    went.state = query({ isFetching: true });
    const loading = renderPage(MEMBER, '/events/all?when=past&going=true');
    expect(screen.getByLabelText('Loading events')).toBeInTheDocument();
    expect(tabTexts()[1]).toBe('Past');
    loading.unmount();

    went.state = query({ isError: true });
    renderPage(MEMBER, '/events/all?when=past&going=true');
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(went.state.refetch).toHaveBeenCalledTimes(1);
    expect(pastEvents.state.refetch).not.toHaveBeenCalled();
  });

  it('both counts follow that filter on either tab', () => {
    going.uids = ['dec'];
    went.state = query({ data: ['p-jan', 'p-dec'] });
    renderPage(MEMBER, '/events/all?going=true');
    expect(went.enabled).toContain(true);
    expect(tabTexts()).toEqual(['Live & upcoming 1', 'Past 2']);
    fireEvent.click(pastTab());
    expect(tabTexts()).toEqual(['Live & upcoming 1', 'Past 2']);
  });

  it('a query that is switched off is not waited for', () => {
    went.state = query({ fetchStatus: 'idle' });
    renderPage(MEMBER, '/events/all?when=past&going=true');
    expect(screen.queryByLabelText('Loading events')).toBeNull();
    expect(tabTexts()[1]).toBe('Past 0');
  });

  it('without it, the list does not wait for the pills', () => {
    went.state = query({ isFetching: true });
    renderPage(MEMBER, PAST);
    expect(listed()).toEqual(NEWEST_FIRST);
  });
});

describe('Calendar', () => {
  const grid = (uid: string) => document.querySelector(`[class*="boardGrid"] [data-event-uid="${uid}"]`) as HTMLElement;

  it('shows past days when the member steps back, from the same events', () => {
    renderPage({}, '/events/all?view=calendar&cal=month');
    expect(card('p-nov')).not.toBeNull();
    expect(card('now')).not.toBeNull();
    for (let i = 0; i < 10; i++) fireEvent.click(screen.getByRole('button', { name: 'Previous month' }));
    expect(card('p-jan')).not.toBeNull();
    expect(card('p-newyear')).not.toBeNull();
  });

  it('a past Week card reads "N went"; one still to come reads "N going"', () => {
    renderPage({}, '/events/all?view=calendar&cal=week');
    expect(within(grid('now')).getByText('5 going')).toBeInTheDocument();
    act(() => jest.advanceTimersByTime(30_000));
    expect(within(grid('now')).getByText('5 went')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Previous week' }));
    fireEvent.click(screen.getByRole('button', { name: 'Previous week' }));
    expect(within(grid('p-nov')).getByText('1 went')).toBeInTheDocument();
  });

  it('shows an event once, before and after it ends', () => {
    pastEvents.state = query({ data: [...past(), on('now', TODAY)] });
    renderPage({}, '/events/all?view=calendar&cal=month');
    expect(document.querySelectorAll('[data-event-uid="now"]')).toHaveLength(1);
    act(() => jest.advanceTimersByTime(30_000));
    expect(document.querySelectorAll('[data-event-uid="now"]')).toHaveLength(1);
  });

  it('opens a linked past event’s week', () => {
    renderPage({}, '/events/all?view=calendar&event=p-jan');
    expect(screen.getByTestId('events-calendar')).toHaveTextContent('January 2030');
    expect(card('p-jan').className).toMatch(/barHighlight/);
  });

  const label = () => document.querySelector('[data-testid="events-calendar"] h3')?.textContent;
  const late = (rerender: (ui: React.ReactElement) => void) => {
    pastEvents.state = query({ data: past() });
    rerender(
      <AllEventsPage
        result={{ ok: true, items: upcoming() }}
        signedIn={false}
        viewerUid={null}
        memberCity={undefined}
        serverNow={NOW}
        serverTodayIso={TODAY}
        submitHref="https://irl.example/submit"
      />,
    );
  };

  it('moves to a linked past event when past events come, unless the visitor has moved it', () => {
    const url = '/events/all?view=calendar&cal=month&event=p-jan';
    pastEvents.state = query({ isFetching: true });
    const still = renderPage({}, url);
    expect(label()).toBe('November 2030');
    late(still.rerender);
    expect(label()).toBe('January 2030');
    still.unmount();

    (
      [
        ['Next month', 'December 2030'],
        ['Today', 'November 2030'],
        ['Wednesday, November 13: open the week', 'Nov 11 – Nov 17, 2030'],
      ] as const
    ).forEach(([button, shown]) => {
      pastEvents.state = query({ isFetching: true });
      const moved = renderPage({}, url);
      fireEvent.click(screen.getByRole('button', { name: button }));
      late(moved.rerender);
      expect(label()).toBe(shown);
      moved.unmount();
    });
  });

  it.each(['event=long', 'city=Oslo'])('stays where it is when the event it opened on ends (%s)', (by) => {
    // Under way since October: it opens on today, and would move to October, or to the city's next event.
    const long = on('long', '2030-10-10', { endDay: TODAY, endDate: `${TODAY}T12:00:30.000Z`, city: 'Oslo' });
    const items = [long, ...upcoming(), on('oslo', '2031-02-02', { city: 'Oslo' })];
    renderPage({ result: { ok: true, items } }, `/events/all?view=calendar&cal=month&${by}`);
    expect(label()).toBe('November 2030');
    act(() => jest.advanceTimersByTime(30_000));
    expect(label()).toBe('November 2030');
  });

  it('opens on a chosen city’s first event coming up, not its oldest past one', () => {
    pastEvents.state = query({ data: [...past(), on('p-dubai', '2029-05-01', { city: 'Dubai' })] });
    renderPage({}, '/events/all?view=calendar&cal=month&city=Dubai');
    expect(label()).toBe('December 2030');
  });

  it('its drawer steps through past events, oldest first, then what is coming up', () => {
    renderPage({}, '/events/all?view=calendar&cal=month');
    fireEvent.click(card('p-nov'));
    expect(screen.getByTestId('event-drawer')).toHaveAttribute(
      'data-sequence',
      'p-dec,p-newyear,p-jan,p-nov,now,dec,jan',
    );
  });

  it('stays a calendar when only past events match, and says nothing matches when none does', () => {
    const { unmount } = renderPage({}, '/events/all?view=calendar&city=Paris');
    expect(screen.getByTestId('events-calendar')).toBeInTheDocument();
    expect(tabTexts()).toEqual(['Live & upcoming 0', 'Past 2']);
    unmount();
    renderPage({}, '/events/all?view=calendar&search=zzz');
    expect(screen.getByText('No live or upcoming events match')).toBeInTheDocument();
  });

  it('under "Events I’m going to", shows the past ones the viewer went to', () => {
    went.state = query({ data: ['p-nov'] });
    renderPage(MEMBER, '/events/all?view=calendar&cal=month&going=true');
    expect(went.enabled).toContain(true);
    expect(card('p-nov')).not.toBeNull();
    expect(card('now')).toBeNull();
    fireEvent.click(screen.getByRole('tab', { name: 'Week' }));
    fireEvent.click(screen.getByRole('button', { name: 'Previous week' }));
    fireEvent.click(screen.getByRole('button', { name: 'Previous week' }));
    expect(within(grid('p-nov')).getByText('Went')).toBeInTheDocument();
  });
});

describe('Embed', () => {
  const scope = async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Embed' }));
    await act(async () => void jest.advanceTimersByTime(500));
    const dialog = screen.getByRole('dialog');
    return { dialog, src: dialog.querySelector('iframe')?.getAttribute('src') };
  };

  it('on Past: the link carries `when=past`, and the dialog says "All past events"', async () => {
    renderPage({}, PAST);
    const { dialog, src } = await scope();
    expect(within(dialog).getByText('List view · All past events')).toBeInTheDocument();
    expect(src).toBe('/events/embed?when=past');
  });

  it('on Past with a filter: both', async () => {
    renderPage({}, '/events/all?when=past&view=map&mode=Online');
    const { dialog, src } = await scope();
    expect(within(dialog).getByText('Map view · Online')).toBeInTheDocument();
    expect(src).toBe('/events/embed?view=map&when=past&mode=Online');
  });

  it('in Calendar, where `when` and `year` mean nothing, the link carries neither', async () => {
    renderPage({}, '/events/all?when=past&year=2029&view=calendar&cal=month');
    const { dialog, src } = await scope();
    expect(within(dialog).getByText('Month calendar · All live & upcoming events')).toBeInTheDocument();
    expect(src).toBe('/events/embed?view=calendar&cal=month');
  });

  it('on Live & upcoming, the link is as it was', async () => {
    renderPage({}, '/events/all?year=2029');
    expect((await scope()).src).toBe('/events/embed');
  });

  it('`/events/embed?when=past` shows Past alone, and links to it on the full page', () => {
    renderPage({ embed: true }, '/events/embed?when=past&mode=In%20person');
    expect(listed()).toEqual(['p-nov', 'p-jan', 'p-newyear']);
    expect(screen.queryByRole('tablist', { name: 'When' })).toBeNull();
    expect(yearPicker()).toBeNull();
    expect(screen.getByRole('link', { name: /All events on PL Directory/ })).toHaveAttribute(
      'href',
      '/events/all?when=past&mode=In+person',
    );
  });

  it('an older embed link is unchanged, and asks for no past events', () => {
    renderPage({ embed: true }, '/events/embed');
    expect(listed()).toEqual(['now', 'dec', 'jan']);
    expect(pastEvents.enabled).not.toContain(true);
  });

  it('an embed of the Calendar asks for none either, and says so when nothing is coming up', () => {
    pastEvents.state = query({ fetchStatus: 'idle' });
    renderPage({ embed: true }, '/events/embed?view=calendar&search=zzz');
    expect(pastEvents.enabled).not.toContain(true);
    expect(screen.getByText('No live or upcoming events match')).toBeInTheDocument();
  });

  it('only an embed of Past asks for them', () => {
    renderPage({ embed: true }, '/events/embed?when=past');
    expect(pastEvents.enabled).toContain(true);
  });
});

describe('the year', () => {
  it('"All years", then each year with a past event by its first day, newest first', async () => {
    renderPage({}, PAST);
    expect(yearPicker()).toHaveTextContent('All years');
    expect(await yearOptions()).toEqual(['All years', '2030', '2029']);
  });

  it('is there only on Past in List and Map', () => {
    renderPage({}, '/events/all?year=2029');
    expect(yearPicker()).toBeNull();
    fireEvent.click(pastTab());
    expect(yearPicker()).not.toBeNull();
    fireEvent.click(screen.getByRole('tab', { name: 'Map' }));
    expect(yearPicker()).not.toBeNull();
    fireEvent.click(screen.getByRole('tab', { name: 'Calendar' }));
    expect(yearPicker()).toBeNull();
  });

  it('hides while past events are of one year, also when that year is in the address', () => {
    pastEvents.state = query({ data: past().slice(0, 2) });
    renderPage({}, PAST).unmount();
    renderPage({}, '/events/all?when=past&year=2030');
    expect(yearPicker()).toBeNull();
    expect(listed()).toEqual(['p-nov', 'p-jan']);
  });

  it('narrows the list and the Past count, refetches nothing, keeps the filters, and is recorded', async () => {
    renderPage({}, '/events/all?when=past&city=Paris');
    const asked = pastEvents.enabled.length;
    await pickYear('2029');
    expect(listed()).toEqual(['p-newyear']);
    expect(tabTexts()).toEqual(['Live & upcoming 0', 'Past 1']);
    expect(storeParams().toString()).toBe('when=past&city=Paris&year=2029');
    expect(pastEvents.state.refetch).not.toHaveBeenCalled();
    expect(new Set(pastEvents.enabled.slice(asked))).toEqual(new Set([true]));
    expect(analytics.onEventsYearChanged.mock.calls).toEqual([[{ year: '2029', view: 'list' }]]);
    expect(analytics.onEventsFiltersApplied).not.toHaveBeenCalled();

    await pickYear('All years');
    expect(storeParams().has('year')).toBe(false);
    expect(listed()).toEqual(['p-jan', 'p-newyear']);
    expect(analytics.onEventsYearChanged).toHaveBeenLastCalledWith({ year: 'all', view: 'list' });
  });

  it('goes by the first day: an event over New Year is in the year it began', () => {
    renderPage({}, '/events/all?when=past&year=2030');
    expect(listed()).toEqual(['p-nov', 'p-jan']);
  });

  it('narrows the Map, the city header and the drawer’s previous / next', () => {
    const list = renderPage({}, '/events/all?when=past&year=2029&city=Paris');
    expect(screen.getByText(/^1 past event · Dec 30, 2029 – Jan 3, 2030 · /)).toBeInTheDocument();
    list.unmount();
    renderPage({}, '/events/all?when=past&year=2029&view=map&event=p-dec');
    expect(screen.getByTestId('events-map')).toHaveAttribute('data-events', 'p-newyear,p-dec');
    expect(screen.getByTestId('event-drawer')).toHaveAttribute('data-sequence', 'p-newyear,p-dec');
  });

  it('the rail’s options and counts are of that year, and a picked value the year has none of stays', () => {
    pastEvents.state = query({
      data: [
        ...past(),
        on('p-paris', '2029-05-01', { city: 'Paris', hosts: ['Host A'] }),
        on('p-oslo', '2029-04-01', { city: 'Oslo', hosts: ['Host B'] }),
      ],
    });
    renderPage({}, '/events/all?when=past&year=2029&city=Lisbon');
    fireEvent.click(filtersDoor());
    expect(within(rail()).getByText('Host A')).toBeInTheDocument();
    expect(within(rail()).queryByText('Past Host')).toBeNull();
    expect(rail()).toHaveTextContent(/Paris2/); // Of 3 in every year.
    expect(within(rail()).getByText('Lisbon')).toBeInTheDocument();
  });

  it('so does "Events I went to"', () => {
    went.state = query({ data: ['p-jan', 'p-dec'] });
    renderPage(MEMBER, '/events/all?when=past&year=2029');
    fireEvent.click(filtersDoor());
    expect(within(rail()).getByText('Events I went to (1)')).toBeInTheDocument();
  });

  it('"Show all events" clears it too, with or without filters', () => {
    const page = renderPage({}, '/events/all?when=past&year=2019');
    fireEvent.click(screen.getByRole('button', { name: 'Show all events' }));
    expect(storeParams().toString()).toBe('when=past');
    expect(listed()).toEqual(NEWEST_FIRST);
    expect(analytics.onEventsYearChanged).toHaveBeenCalledWith({ year: 'all', view: 'list' });
    page.unmount();

    const map = renderPage({}, '/events/all?when=past&view=map&year=2029&search=zzz');
    fireEvent.click(screen.getByRole('button', { name: 'Show all events' }));
    expect(storeParams().toString()).toBe('when=past&view=map');
    map.unmount();
  });

  it('its options are not narrowed by the other filters', async () => {
    renderPage({}, '/events/all?when=past&year=2029&search=zzz');
    expect(yearPicker()).toHaveTextContent('2029');
    expect(await yearOptions()).toEqual(['All years', '2030', '2029']);
  });

  it('is no applied filter: not counted, and kept by Clear filters', () => {
    renderPage({}, '/events/all?when=past&year=2029&mode=Online');
    expect(within(filtersDoor()).getByText('1')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Clear all' }));
    expect(storeParams().toString()).toBe('when=past&year=2029');
    expect(listed()).toEqual(['p-newyear', 'p-dec']);
  });

  it('stays in the address on the other tab, where it means nothing, and is back on Past', () => {
    renderPage({}, '/events/all?when=past&year=2029');
    fireEvent.click(liveTab());
    expect(storeParams().get('year')).toBe('2029');
    expect(listed()).toEqual(['now', 'dec', 'jan']);
    expect(tabTexts()).toEqual(['Live & upcoming 3', 'Past 4']);
    fireEvent.click(pastTab());
    expect(listed()).toEqual(['p-newyear', 'p-dec']);
  });

  it('Calendar ignores it', () => {
    renderPage({}, '/events/all?when=past&year=2029&view=calendar&cal=month');
    expect(card('p-nov')).not.toBeNull();
    expect(card('now')).not.toBeNull();
  });

  it.each(['all', '20', '20299', '2029x'])('ignores `year=%s`', (value) => {
    renderPage({}, `/events/all?when=past&year=${value}`);
    expect(listed()).toEqual(NEWEST_FIRST);
    expect(yearPicker()).toHaveTextContent('All years');
  });

  it('a year with no past event shows the empty state, names that year, and lists it to leave it', async () => {
    renderPage({}, '/events/all?when=past&year=2019');
    expect(screen.getByText('No past events match')).toBeInTheDocument();
    expect(yearPicker()).toHaveTextContent('2019');
    expect(await yearOptions()).toEqual(['All years', '2030', '2029', '2019']);
  });

  it('the embed link carries it, and the embed shows that year', async () => {
    const page = renderPage({}, '/events/all?when=past&year=2029');
    fireEvent.click(screen.getByRole('button', { name: 'Embed' }));
    await act(async () => void jest.advanceTimersByTime(500));
    expect(screen.getByRole('dialog').querySelector('iframe')).toHaveAttribute(
      'src',
      '/events/embed?when=past&year=2029',
    );
    page.unmount();
    renderPage({ embed: true }, '/events/embed?when=past&year=2029');
    expect(listed()).toEqual(['p-newyear', 'p-dec']);
  });

  it('is a named control', () => {
    renderPage({}, '/events/all?when=past&year=2029');
    expect(screen.getByRole('button', { name: 'Year: 2029' })).toBeInTheDocument();
  });
});

describe('picking a year on a scrolled list', () => {
  const scroll = jest.fn();
  const rect = { list: 0 };
  let position = 'sticky';
  const layout = () => document.querySelector('[class*="layout"]') as HTMLElement;
  beforeEach(() => {
    scroll.mockClear();
    rect.list = -5000;
    position = 'sticky';
    Element.prototype.scrollIntoView = scroll;
    jest.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
      const top = this === layout() ? rect.list : 0;
      return { x: 0, y: top, top, left: 0, right: 0, bottom: top, width: 0, height: 0 } as DOMRect;
    });
    jest.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(63);
    const real = window.getComputedStyle;
    // jsdom applies no stylesheet: the list's room is the header's 80px, the toolbar's height and 24px.
    jest.spyOn(window, 'getComputedStyle').mockImplementation((el, pseudo) => {
      const style = real(el, pseudo);
      if ((el as HTMLElement) === layout()) {
        const bar = parseFloat((el as HTMLElement).style.getPropertyValue('--events-toolbar-height')) || 0;
        return Object.assign(Object.create(style), { scrollMarginTop: `${80 + bar + 24}px` });
      }
      return /toolbar$|toolbar /.test(el.className) ? Object.assign(Object.create(style), { position }) : style;
    });
  });
  afterEach(() => {
    jest.restoreAllMocks();
    delete (Element.prototype as Partial<Element>).scrollIntoView;
  });
  const toTop = [{ block: 'start', behavior: 'instant' }];

  it('goes to the top of the list, at once, also for "All years"', async () => {
    renderPage({}, PAST);
    await pickYear('2029');
    expect(scroll.mock.contexts).toEqual([layout()]);
    expect(scroll.mock.calls).toEqual([toTop]);
    await pickYear('All years');
    expect(scroll.mock.calls).toEqual([toTop, toTop]);
  });

  it('once the year’s list is there', async () => {
    const listedThen: unknown[] = [];
    scroll.mockImplementation(() => listedThen.push(listed()));
    renderPage({}, PAST);
    await pickYear('2029');
    expect(listedThen).toEqual([['p-newyear', 'p-dec']]);
  });

  it('keeps clear of the toolbar, as tall as it is, where it stays in view', async () => {
    renderPage({}, PAST);
    await pickYear('2029');
    expect(layout().style.getPropertyValue('--events-toolbar-height')).toBe('63px');
    position = 'relative';
    await pickYear('All years');
    expect(layout().style.getPropertyValue('--events-toolbar-height')).toBe('0px');
  });

  it('stays put when the top of the list is in view', async () => {
    rect.list = 80 + 63 + 24;
    renderPage({}, PAST);
    await pickYear('2029');
    expect(scroll).not.toHaveBeenCalled();
    rect.list -= 1;
    await pickYear('All years');
    expect(scroll).toHaveBeenCalledTimes(1);
  });

  it('does not do it on the Map, nor for the year already picked', async () => {
    const map = renderPage({}, '/events/all?when=past&view=map');
    await pickYear('2029');
    fireEvent.click(screen.getByRole('tab', { name: 'List' }));
    expect(scroll).not.toHaveBeenCalled();
    map.unmount();
    renderPage({}, '/events/all?when=past&year=2029');
    await pickYear('2029');
    expect(scroll).not.toHaveBeenCalled();
  });

  it('is for a pick only: not Back, Forward, a tab or "Show all events"', () => {
    renderPage({}, '/events/all?when=past&year=2029');
    const goTo = (url: string) => {
      window.history.replaceState(null, '', url);
      act(() => void window.dispatchEvent(new PopStateEvent('popstate')));
    };
    goTo(PAST);
    goTo('/events/all?when=past&year=2019');
    fireEvent.click(liveTab());
    fireEvent.click(pastTab());
    fireEvent.click(screen.getByRole('button', { name: 'Show all events' }));
    expect(listed()).toEqual(NEWEST_FIRST);
    expect(scroll).not.toHaveBeenCalled();
  });
});

describe('photos load near the screen only', () => {
  const withPhotos = () => ({
    goingCount: 3,
    hosts: ['Host A', 'Host B'],
    picture: 'https://img.example/event.png',
    faces: ['a', 'b', 'c'].map((uid) => ({ uid, name: uid, image: `https://img.example/${uid}.png` })),
  });
  /** Every image under `root`: loaded lazily, with the sizes it has from the start. */
  const images = (root: ParentNode) =>
    Array.from(root.querySelectorAll('img')).map((el) => ({
      lazy: el.getAttribute('loading') === 'lazy',
      face: /facepile/.test(el.parentElement?.className ?? ''),
      host: /hostFaces/.test(el.parentElement?.className ?? ''),
      size: `${el.getAttribute('width')}x${el.getAttribute('height')}`,
    }));
  const expectLazy = (root: ParentNode, faces: number, hosts: number) => {
    const all = images(root);
    expect(all.filter((img) => !img.lazy)).toEqual([]);
    expect(all.filter((img) => img.face).map((img) => img.size)).toEqual(Array(faces).fill('20x20'));
    expect(all.filter((img) => img.host).map((img) => img.size)).toEqual(Array(hosts).fill('16x16'));
  };

  it('on a Past card: the faces, the hosts and the picture', () => {
    pastEvents.state = query({ data: [on('p-photos', '2030-11-12', withPhotos())] });
    renderPage({}, PAST);
    expect(images(card('p-photos'))).toHaveLength(6);
    expectLazy(card('p-photos'), 3, 2);
  });

  it('on a Near you tile', () => {
    renderPage({ ...MEMBER, result: { ok: true, items: [on('near', '2030-12-03', withPhotos())] } });
    expectLazy(screen.getByRole('region', { name: 'Near you in Lisbon' }), 3, 2);
  });

  it('on a Week card and a card across days', () => {
    const items = [
      on('one', TODAY, { ...withPhotos(), endDate: `${TODAY}T18:00:00.000Z` }),
      on('span', TODAY, { ...withPhotos(), endDay: '2030-11-27', endDate: '2030-11-27T18:00:00.000Z' }),
    ];
    renderPage({ result: { ok: true, items } }, '/events/all?view=calendar&cal=week');
    expectLazy(card('one'), 3, 0);
    expectLazy(card('span'), 3, 0);
  });

  it('on a row under the Map', () => {
    const { container } = render(
      <EventRows
        events={[on('row', '2030-11-12', withPhotos())]}
        pastAsOf={TODAY}
        goingUids={new Set()}
        onOpen={jest.fn()}
        onPrepare={jest.fn()}
      />,
    );
    expectLazy(container, 3, 0);
  });
});

describe('a link to Past is Past from its first paint', () => {
  const page = (url: string, over: Partial<AllEventsPageProps> = {}) => (
    <AllEventsPage
      result={{ ok: true, items: upcoming() }}
      signedIn={false}
      viewerUid={null}
      memberCity={undefined}
      serverNow={NOW}
      serverTodayIso={TODAY}
      submitHref="https://irl.example/submit"
      initialQuery={pastLandingQuery(Object.fromEntries(new URLSearchParams(url.split('?')[1])))}
      {...over}
    />
  );
  let container: HTMLElement;
  let root: ReturnType<typeof hydrateRoot> | null = null;
  /** The page as the browser first has it: the server's HTML. Past events are still to be asked for. */
  const serve = (url: string, over?: Partial<AllEventsPageProps>) => {
    window.history.replaceState(null, '', url);
    pastEvents.state = query({ isFetching: true });
    container = document.createElement('div');
    container.innerHTML = renderToString(page(url, over));
    document.body.appendChild(container);
  };
  const hydrate = async (url: string, over?: Partial<AllEventsPageProps>) => {
    const onRecoverableError = jest.fn();
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    await act(async () => {
      root = hydrateRoot(container, page(url, over), { onRecoverableError });
    });
    expect(onRecoverableError).not.toHaveBeenCalled();
    expect(consoleError.mock.calls.filter(([message]) => /hydrat/i.test(String(message)))).toEqual([]);
  };
  afterEach(() => {
    act(() => root?.unmount());
    root = null;
    container.remove();
    jest.restoreAllMocks();
  });
  const skeleton = () => screen.queryByLabelText('Loading events');
  const expectPast = () => {
    expect(skeleton()).toBeInTheDocument();
    expect(document.querySelector('[data-event-uid]')).toBeNull();
    expect(screen.queryByText('All live & upcoming')).toBeNull();
    expect(screen.queryByRole('region', { name: 'Browse by city' })).toBeNull();
  };

  it.each([PAST, `${PAST}&year=2029`, `${PAST}&city=Paris`, `${PAST}&year=2029&city=Paris`])('%s', async (url) => {
    serve(url);
    expectPast();
    expect(pastTab()).toHaveAttribute('aria-selected', 'true');
    expect(liveTab()).toHaveAttribute('aria-selected', 'false');
    const html = container.querySelector('[role="tablist"]');
    await hydrate(url);
    expectPast();
    expect(pastTab()).toHaveAttribute('aria-selected', 'true');
    // The server's own element, taken over.
    expect(container.querySelector('[role="tablist"]')).toBe(html);
  });

  it('in the Map, with the filters’ count and chips', async () => {
    const url = `${PAST}&view=map&city=Paris&mode=In person`;
    serve(url);
    expectPast();
    const drawn = () => [
      screen.getByRole('tab', { name: 'Map' }).getAttribute('aria-selected'),
      within(filtersDoor()).getByText('2').textContent,
      screen.getAllByRole('button', { name: /^Remove filter/ }).map((el) => el.textContent),
      liveTab().textContent?.trim(),
    ];
    const served = drawn();
    expect(served).toEqual(['true', '2', ['In person', 'Paris'], 'Live & upcoming 0']);
    await hydrate(url);
    expect(drawn()).toEqual(served);
  });

  it('in the embed, which asks for past events from its first render and links to the same', async () => {
    const url = '/events/embed?when=past&year=2029';
    serve(url, { embed: true });
    expectPast();
    const link = () => screen.getByRole('link', { name: /All events on PL Directory/ }).getAttribute('href');
    expect(link()).toBe('/events/all?when=past&year=2029');
    await hydrate(url, { embed: true });
    expectPast();
    expect(new Set(pastEvents.enabled)).toEqual(new Set([true]));
  });

  it('is never Live & upcoming in between', async () => {
    serve(PAST);
    const changes: string[] = [];
    const watch = new MutationObserver((records) =>
      records.forEach((r) => changes.push(`${r.attributeName ?? 'nodes'} ${(r.target as HTMLElement).textContent}`)),
    );
    watch.observe(container, { subtree: true, childList: true, attributes: true, attributeFilter: ['aria-selected'] });
    await hydrate(PAST);
    await act(async () => void jest.advanceTimersByTime(50));
    watch.disconnect();
    expect(changes.filter((c) => c.startsWith('aria-selected'))).toEqual([]);
    expect(changes.filter((c) => /Event now/.test(c))).toEqual([]);
  });

  it('then follows the address as ever: the list, a tab, Back', async () => {
    serve(`${PAST}&year=2029`);
    await hydrate(`${PAST}&year=2029`);
    pastEvents.state = query({ data: past() });
    await act(async () => root?.render(page(`${PAST}&year=2029`)));
    expect(listed()).toEqual(['p-newyear', 'p-dec']);
    fireEvent.click(liveTab());
    expect(listed()).toEqual(['now', 'dec', 'jan']);
    expect(storeParams().toString()).toBe('year=2029');
    window.history.replaceState(null, '', PAST);
    act(() => void window.dispatchEvent(new PopStateEvent('popstate')));
    expect(listed()).toEqual(NEWEST_FIRST);
  });

  it('opens no drawer in the server’s HTML, and the linked event’s after', async () => {
    const url = `${PAST}&event=p-jan`;
    serve(url);
    expect(screen.queryByTestId('event-drawer')).toBeNull();
    await hydrate(url);
    expect(screen.getByTestId('event-drawer')).toHaveAttribute('data-uid', 'p-jan');
  });

  it.each(['/events/all', '/events/all?city=Lisbon', '/events/all?view=calendar', `${PAST}&view=calendar`])(
    '%s: the server’s HTML is the plain page’s, as before',
    async (url) => {
      serve(url);
      const plain = document.createElement('div');
      plain.innerHTML = renderToString(page('/events/all', { initialQuery: undefined }));
      expect(container.innerHTML).toBe(plain.innerHTML);
      expect(listed()).toEqual(['now', 'dec', 'jan']);
      await hydrate(url);
    },
  );
});

describe('the address', () => {
  const settle = () => act(() => jest.advanceTimersByTime(50));
  const goBackTo = (url: string) => {
    window.history.replaceState(null, '', url);
    act(() => void window.dispatchEvent(new PopStateEvent('popstate')));
    settle();
  };

  it('carries `when=past` again after Past, Back and Past', () => {
    renderPage();
    settle();
    fireEvent.click(pastTab());
    settle();
    expect(window.location.search).toBe('?when=past');
    goBackTo('/events/all');
    expect(liveTab()).toHaveAttribute('aria-selected', 'true');
    fireEvent.click(pastTab());
    settle();
    expect(window.location.search).toBe('?when=past');
    expect(listed()).toEqual(NEWEST_FIRST);
  });

  it('follows the embed again too after Back', () => {
    const PLAIN = '?when=past';
    renderPage({ embed: true }, `/events/embed${PLAIN}&search=zzz`);
    settle();
    const showAll = () => {
      fireEvent.click(screen.getByRole('button', { name: 'Show all events' }));
      settle();
    };
    showAll();
    expect(window.location.search).toBe(PLAIN);
    goBackTo(`/events/embed${PLAIN}&search=zzz`);
    showAll();
    expect(window.location.search).toBe(PLAIN);
    expect(listed()).toEqual(NEWEST_FIRST);
  });

  it('is not written again by Back itself', () => {
    const push = jest.spyOn(window.history, 'pushState');
    renderPage({}, PAST);
    settle();
    goBackTo('/events/all');
    expect(push).not.toHaveBeenCalled();
    expect(listed()).toEqual(['now', 'dec', 'jan']);
    push.mockRestore();
  });
});

describe('phones', () => {
  it('have the switch in the toolbar, and the Past rail in the Filters sheet', async () => {
    renderPage({}, PAST);
    const toolbar = screen.getByRole('tablist', { name: 'When' }).parentElement as HTMLElement;
    expect(toolbar.className).toMatch(/toolbarStart/);
    // Not in the part of the toolbar that phones and tablets hide.
    expect(screen.getByRole('tablist', { name: 'When' }).closest('[class*="toolbarEnd"]')).toBeNull();
    await waitFor(() => expect(pastTab()).toBeInTheDocument());
  });
});
