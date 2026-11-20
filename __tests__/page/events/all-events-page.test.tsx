import React from 'react';
import '@testing-library/jest-dom';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';

import { AllEventsPage, type AllEventsPageProps } from '@/components/page/events/all-events/AllEventsPage';
import { useAllEventsFilterStore } from '@/services/events/all-events-filters.store';
import type { AllEventsItem } from '@/services/events/all-events.types';
import { allEventsItem as item } from '@/services/events/all-events.fixtures';

/*
 * LAB-3247 slice A (LAB-3317): the native All Events page. Header, Near you / Add location, Browse by city and the city
 * scope, the toolbar, rail and chips, the List, the states, `?event=` and the page's analytics.
 */

const refresh = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), prefetch: jest.fn(), refresh }),
  usePathname: () => '/events/all',
  useSearchParams: () => new URLSearchParams(window.location.search),
}));

type DrawerProps = { eventUid: string | null; source: string; onClose: () => void };
jest.mock(
  'next/dynamic',
  () => () =>
    function EventDrawerStandIn(props: DrawerProps) {
      if (!props.eventUid) return null;
      return (
        <div data-testid="event-drawer" data-uid={props.eventUid} data-source={props.source}>
          <button type="button" onClick={props.onClose}>
            Close drawer
          </button>
        </div>
      );
    },
);
jest.mock('@/components/page/events/EventDrawer/EventDrawer', () => ({ EventDrawer: () => null }));

const analytics = {
  onEventsViewChanged: jest.fn(),
  onEventsFiltersApplied: jest.fn(),
  onEventsCitySelected: jest.fn(),
  onSubmitEventButtonClicked: jest.fn(),
  onGoToEventsButtonClicked: jest.fn(),
};
jest.mock('@/analytics/events.analytics', () => ({ useEventsAnalytics: () => analytics }));

const going = { uids: [] as string[], enabled: [] as boolean[] };
jest.mock('@/services/events/hooks/useMyUpcomingEventUids', () => ({
  useMyUpcomingEventUids: (enabled: boolean) => {
    going.enabled.push(enabled);
    return { data: enabled ? going.uids : undefined };
  },
}));
jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useQueryClient: () => ({ setQueryData: jest.fn() }),
}));
jest.mock('@/services/events/hooks/useEventDrawerQueries', () => ({ usePrefetchEventDetail: () => jest.fn() }));
jest.mock('@/components/core/ToastContainer', () => ({ toast: { success: jest.fn() } }));

const CITIES = ['Lisbon', 'Dubai', 'Paris', 'Berlin', 'Tokyo', 'Denver', 'Bangalore'];

/** Lisbon ×4 (one online-only elsewhere), then one event in each other city. */
function sample(): AllEventsItem[] {
  return [
    ...[1, 2, 3, 4].map((n) =>
      item({
        uid: `lis${n}`,
        name: `Lisbon event ${n}`,
        startDate: `2030-12-0${n}T09:00:00Z`,
        startDay: `2030-12-0${n}`,
        endDay: `2030-12-0${n}`,
      }),
    ),
    item({
      uid: 'dai',
      name: 'DAI Summit',
      city: 'Bangalore',
      place: 'Bangalore, India',
      startDay: '2030-12-03',
      endDay: '2030-12-04',
      startTime: '9:00 AM',
      zone: 'UTC+5:30',
      hosts: ['Protocol Labs'],
      goingCount: 3,
      faces: [{ uid: 'f1', name: 'Ann', image: null }],
    }),
    item({
      uid: 'call',
      name: 'Community Call',
      city: null,
      place: null,
      mode: 'Virtual',
      startDay: '2030-12-05',
      endDay: '2030-12-05',
    }),
    ...CITIES.slice(1, 6).map((city, i) =>
      item({
        uid: city.toLowerCase(),
        name: `${city} meetup`,
        city,
        place: city,
        mode: i === 0 ? 'Hybrid' : 'In-Person',
        startDay: `2030-12-1${i}`,
        endDay: `2030-12-1${i}`,
      }),
    ),
  ];
}

function renderPage(over: Partial<AllEventsPageProps> = {}, url = '/events/all') {
  window.history.replaceState(null, '', url);
  return render(
    <AllEventsPage
      result={{ ok: true, items: sample() }}
      signedIn={false}
      viewerUid={null}
      memberCity={undefined}
      serverTodayIso="2030-12-01"
      submitHref="https://irl.example/auth/labos?returnUrl=%2Fevents%2Fadd"
      eventsAppHref="https://events.example/calendar"
      {...over}
    />,
  );
}

const signedIn = (memberCity: string | null) => ({ signedIn: true, viewerUid: 'm1', memberCity });
const storeParams = () => useAllEventsFilterStore.getState().params;
const card = (name: string) => screen.getByRole('button', { name: new RegExp(name) });
/** The toolbar's door; the phone bar has a "Filters" button of its own. */
const filtersDoor = () => document.querySelector('[aria-controls="events-filters"]') as HTMLElement;
const toolbarCount = () => screen.getByRole('heading', { name: /^Coming up/ }).nextSibling?.textContent;

beforeEach(() => {
  jest.useFakeTimers({ now: new Date('2030-12-01T10:00:00') });
  useAllEventsFilterStore.setState({ params: new URLSearchParams(), _clearImmediate: false });
  going.uids = [];
  going.enabled = [];
  jest.clearAllMocks();
});
afterEach(() => {
  act(() => jest.runOnlyPendingTimers());
  jest.useRealTimers();
});

describe('header and List', () => {
  it('links the events app and the production submit address, with no iframe', () => {
    const { container } = renderPage();
    expect(screen.getByRole('heading', { level: 1, name: 'Events' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Open PL Events/ })).toHaveAttribute(
      'href',
      'https://events.example/calendar',
    );
    expect(screen.getByRole('link', { name: /Submit an event/ })).toHaveAttribute(
      'href',
      'https://irl.example/auth/labos?returnUrl=%2Fevents%2Fadd',
    );
    expect(container.querySelector('iframe')).toBeNull();
    expect(screen.getByRole('heading', { name: 'Coming up' })).toBeInTheDocument();
    expect(toolbarCount()).toBe('11 events');
  });

  it('reads a multi-day card in its own zone, with host, place and faces', () => {
    renderPage();
    const dai = card('DAI Summit');
    expect(within(dai).getByText('9:00 AM UTC+5:30 · Day 1 of 2')).toBeInTheDocument();
    expect(within(dai).getByText('By Protocol Labs')).toBeInTheDocument();
    expect(within(dai).getByText('Bangalore, India')).toBeInTheDocument();
    expect(within(dai).getByText('3 going')).toBeInTheDocument();
  });

  it('says "Online" for an online event and "also online" for a hybrid one', () => {
    renderPage();
    expect(within(card('Community Call')).getByText('Online')).toBeInTheDocument();
    expect(within(card('Dubai meetup')).getByText('Dubai · also online')).toBeInTheDocument();
  });

  it('marks an event the viewer is going to with the Going pill, and only that one', () => {
    going.uids = ['dai'];
    renderPage(signedIn('Berlin'));
    expect(within(card('DAI Summit')).getByText('Going')).toBeInTheDocument();
    expect(screen.getAllByText('Going')).toHaveLength(1);
  });
});

describe('Near you', () => {
  it('shows the 3 soonest events in the member’s city', () => {
    renderPage(signedIn('lisbon, portugal'));
    const near = screen.getByRole('region', { name: 'Near you in Lisbon' });
    const tiles = Array.from(near.querySelectorAll('[data-event-uid]')).map((t) => t.getAttribute('data-event-uid'));
    expect(tiles).toEqual(['lis1', 'lis2', 'lis3']);
  });

  it('asks a member with no location to add one, linking to their profile', () => {
    renderPage(signedIn(null));
    expect(screen.getByText('See events near you.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Add location' })).toHaveAttribute('href', '/members/m1');
  });

  it('stays in every view and with any filter; only a chosen city takes its place', () => {
    const { unmount } = renderPage(signedIn('Lisbon'), '/events/all?mode=Virtual');
    expect(screen.getByRole('region', { name: 'Near you in Lisbon' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('tab', { name: /Calendar/ }));
    expect(screen.getByRole('region', { name: 'Near you in Lisbon' })).toBeInTheDocument();
    unmount();

    renderPage(signedIn(null), '/events/all?view=calendar&search=summit');
    expect(screen.getByText('See events near you.')).toBeInTheDocument();
  });

  it('gives way to the city header when a city is chosen', () => {
    renderPage(signedIn('Lisbon'), '/events/all?city=Dubai');
    expect(screen.queryByText(/Near you in/)).toBeNull();
  });

  it('shows neither to a signed-out visitor, and never asks for their going events', () => {
    renderPage();
    expect(screen.queryByText(/Near you in/)).toBeNull();
    expect(screen.queryByText('See events near you.')).toBeNull();
    expect(going.enabled.every((e) => e === false)).toBe(true);
  });
});

describe('Browse by city', () => {
  it('opens every city in place, scopes the page to one and leaves it again', () => {
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: 'All 7 cities' }));
    fireEvent.click(screen.getByRole('button', { name: /^Dubai/ }));

    expect(screen.getByRole('heading', { name: 'Dubai' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Coming up in Dubai' })).toBeInTheDocument();
    expect(screen.getByText(/1 upcoming event · Dec 10 · Times in Dubai time \(UTC\+0\)/)).toBeInTheDocument();
    expect(screen.queryByText('Lisbon event 1')).toBeNull();
    expect(storeParams().get('city')).toBe('Dubai');
    expect(analytics.onEventsCitySelected).toHaveBeenCalledWith({ city: 'Dubai', from: 'tile' });

    fireEvent.click(screen.getByRole('button', { name: 'All cities' }));
    expect(storeParams().get('city')).toBeNull();
    expect(screen.getByText('Lisbon event 1')).toBeInTheDocument();
  });
});

describe('filters', () => {
  it('opens the rail from the toolbar and closes it from the rail', () => {
    renderPage(signedIn('Berlin'));
    expect(screen.queryByText('Search events')).toBeNull();
    fireEvent.click(filtersDoor());
    const rail = document.getElementById('events-filters') as HTMLElement;
    expect(within(rail).getByText('Search events')).toBeInTheDocument();
    expect(within(rail).getByText("Events I'm going to")).toBeInTheDocument();
    expect(within(rail).getByText('Mode')).toBeInTheDocument();
    fireEvent.click(within(rail).getByRole('button', { name: 'Hide filters' }));
    expect(document.getElementById('events-filters')).toBeNull();
  });

  it('leaves out a facet with one value, and the going switch when signed out', () => {
    renderPage({ result: { ok: true, items: [item({ uid: 'a' }), item({ uid: 'b', city: 'Dubai' })] } });
    fireEvent.click(filtersDoor());
    const rail = document.getElementById('events-filters') as HTMLElement;
    expect(within(rail).queryByText('Mode')).toBeNull();
    expect(within(rail).getByText('City')).toBeInTheDocument();
    expect(within(rail).queryByText("Events I'm going to")).toBeNull();
  });

  it('offers Access type, Focus area and Host once the events carry them, and hides them before', () => {
    const detailed = [
      item({ uid: 'a', access: 'PAID', hosts: ['Protocol Labs'], tags: ['AI'] }),
      item({ uid: 'b', city: 'Dubai', access: 'INVITE ONLY', hosts: ['Filecoin Foundation'], tags: ['Storage'] }),
    ];
    const { unmount } = renderPage({ result: { ok: true, items: detailed } });
    fireEvent.click(filtersDoor());
    let rail = document.getElementById('events-filters') as HTMLElement;
    const titles = ['Access type', 'Focus area', 'City', 'Host'];
    titles.forEach((title) => expect(within(rail).getByText(title)).toBeInTheDocument());
    // The prototype's order: Mode, Access type, Focus area, City, Host.
    const text = rail.textContent ?? '';
    expect(titles.map((t) => text.indexOf(t))).toEqual([...titles.map((t) => text.indexOf(t))].sort((x, y) => x - y));
    unmount();

    renderPage();
    fireEvent.click(filtersDoor());
    rail = document.getElementById('events-filters') as HTMLElement;
    ['Access type', 'Focus area'].forEach((title) => expect(within(rail).queryByText(title)).toBeNull());
  });

  it('narrows the events by host and shows it as a chip', () => {
    renderPage({}, '/events/all?host=Protocol Labs');
    expect(toolbarCount()).toBe('1 event');
    expect(screen.getByText('DAI Summit')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Remove filter Protocol Labs' }));
    expect(storeParams().get('host')).toBeNull();
  });

  it('removes one chip and the count follows', () => {
    renderPage({}, '/events/all?mode=Hybrid&city=Dubai|Lisbon');
    expect(within(filtersDoor()).getByText('3')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Remove filter Dubai' }));
    expect(storeParams().get('city')).toBe('Lisbon');
    expect(within(filtersDoor()).getByText('2')).toBeInTheDocument();
  });

  it('shows only the events the member is going to', () => {
    going.uids = ['dai', 'call'];
    renderPage(signedIn('Berlin'), '/events/all?going=true');
    expect(toolbarCount()).toBe('2 events');
  });

  it('says nothing matches and clears the filters, keeping the open drawer', () => {
    renderPage({}, '/events/all?search=zzz&event=dai');
    expect(screen.getByText('No upcoming events match')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Show all events' }));
    expect(storeParams().get('search')).toBeNull();
    expect(storeParams().get('event')).toBe('dai');
    expect(screen.getByText('Lisbon event 1')).toBeInTheDocument();
  });

  it('restores the view and filters from a copied link', () => {
    renderPage({}, '/events/all?view=calendar&mode=Virtual');
    expect(storeParams().get('view')).toBe('calendar');
    expect(storeParams().get('mode')).toBe('Virtual');
    expect(toolbarCount()).toBe('1 event');
  });
});

describe('states', () => {
  it('keeps the header and offers Try again when the events fail to load', () => {
    renderPage({ result: { ok: false } });
    expect(screen.getByRole('heading', { level: 1, name: 'Events' })).toBeInTheDocument();
    expect(screen.getByText('Events couldn’t load'.replace('’', "'"))).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(refresh).toHaveBeenCalled();
  });
});

describe('the drawer', () => {
  it('opens on landing from `?event=`, marks the card, and closing clears the address', () => {
    renderPage({}, '/events/all?event=dai');
    expect(screen.getByTestId('event-drawer')).toHaveAttribute('data-uid', 'dai');
    expect(screen.getByTestId('event-drawer')).toHaveAttribute('data-source', 'all-events');
    expect(card('DAI Summit').className).toMatch(/highlight/);

    fireEvent.click(screen.getByRole('button', { name: 'Close drawer' }));
    expect(storeParams().get('event')).toBeNull();
    expect(screen.queryByTestId('event-drawer')).toBeNull();
    // The linked event stays marked until another one is opened.
    expect(card('DAI Summit').className).toMatch(/highlight/);
    fireEvent.click(card('Community Call'));
    expect(storeParams().get('event')).toBe('call');
    expect(card('DAI Summit').className).not.toMatch(/highlight/);
  });
});

describe('analytics', () => {
  it('records nothing on landing from a filtered link', () => {
    renderPage({}, '/events/all?mode=Virtual&city=Dubai');
    act(() => jest.advanceTimersByTime(1000));
    expect(analytics.onEventsFiltersApplied).not.toHaveBeenCalled();
    expect(analytics.onEventsCitySelected).not.toHaveBeenCalled();
  });

  it('records a filter the member changes, once it settles', async () => {
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: /^Paris/ }));
    act(() => jest.advanceTimersByTime(400));
    await waitFor(() =>
      expect(analytics.onEventsFiltersApplied).toHaveBeenCalledWith({ key: 'city', values: ['Paris'] }),
    );
  });
});

/*
 * LAB-3320: the Calendar view. Today is Sunday 2030-12-01; Lisbon events on Dec 1–4, DAI Summit Dec 3–4, the
 * Community Call (online) on Dec 5, then one event a day Dec 10–14 (Dubai is hybrid).
 */
describe('Calendar', () => {
  const calendar = () => screen.getByTestId('events-calendar');
  const label = () => within(calendar()).getByRole('heading', { level: 3 }).textContent;
  const inGrid = (uid: string) =>
    calendar().querySelector(`[class*="boardGrid"] [data-event-uid="${uid}"]`) as HTMLElement | null;

  it('is offered next to List, opens on Month from 960px, and records the switch with its mode', () => {
    renderPage();
    fireEvent.click(screen.getByRole('tab', { name: /Calendar/ }));
    expect(storeParams().get('view')).toBe('calendar');
    expect(analytics.onEventsViewChanged).toHaveBeenCalledWith({ view: 'calendar', mode: 'month' });
    expect(within(calendar()).getByRole('tab', { name: 'Month', selected: true })).toBeInTheDocument();
    expect(label()).toBe('December 2030');
    expect(screen.queryByText(/Near you in/)).toBeNull();
  });

  it('shows an event across days as one card over its days, and one-day events in their day', () => {
    renderPage({}, '/events/all?view=calendar&cal=week');
    fireEvent.click(screen.getByRole('button', { name: 'Next week' }));
    expect(label()).toBe('Dec 2 – Dec 8, 2030');
    expect(inGrid('dai')?.style.gridColumn).toBe('2 / 4');
    expect(within(inGrid('dai') as HTMLElement).getByText(/Dec 3 – 4 · Bangalore/)).toBeInTheDocument();
    expect(inGrid('lis2')?.parentElement?.style.gridColumn).toBe('1');
    expect(within(inGrid('call') as HTMLElement).getByText('Online · UTC+0')).toBeInTheDocument();
    expect(within(inGrid('call') as HTMLElement).getByText('9:00 AM – 6:00 PM')).toBeInTheDocument();
    // Phones: the same cards by day, the four busy days only.
    expect(calendar().querySelectorAll('[class*="stackDay"]')).toHaveLength(4);
  });

  it('says so for a quiet week, and Today comes back', () => {
    renderPage({}, '/events/all?view=calendar&cal=week');
    fireEvent.click(screen.getByRole('button', { name: 'Next week' }));
    fireEvent.click(screen.getByRole('button', { name: 'Next week' }));
    fireEvent.click(screen.getByRole('button', { name: 'Next week' }));
    expect(label()).toBe('Dec 16 – Dec 22, 2030');
    expect(within(calendar()).getByText('Nothing this week.')).toBeInTheDocument();
    fireEvent.click(within(calendar()).getByRole('button', { name: 'Today' }));
    expect(label()).toBe('Nov 25 – Dec 1, 2030');
  });

  it('opens a day number’s week from Month', () => {
    renderPage({}, '/events/all?view=calendar&cal=month');
    expect(label()).toBe('December 2030');
    fireEvent.click(screen.getByRole('button', { name: 'Tuesday, December 10: open the week' }));
    expect(label()).toBe('Dec 9 – Dec 15, 2030');
    expect(storeParams().get('cal')).toBe('week');
    expect(analytics.onEventsViewChanged).toHaveBeenCalledWith({ view: 'calendar', mode: 'week' });
  });

  it('opens Month on the month of the week in view', () => {
    renderPage({}, '/events/all?view=calendar&cal=week');
    fireEvent.click(screen.getByRole('button', { name: 'Previous week' }));
    expect(label()).toBe('Nov 18 – Nov 24, 2030');
    fireEvent.click(screen.getByRole('tab', { name: 'Month' }));
    expect(label()).toBe('November 2030');
    expect(storeParams().get('cal')).toBe('month');
    expect(analytics.onEventsViewChanged).toHaveBeenCalledWith({ view: 'calendar', mode: 'month' });
    fireEvent.click(screen.getByRole('button', { name: 'Next month' }));
    expect(label()).toBe('December 2030');
    expect(calendar().querySelector('[data-event-uid="dubai"]')?.textContent).toBe('9:00 AM Dubai meetup');
  });

  it('opens a linked event’s week with its card marked and its drawer open', () => {
    renderPage({}, '/events/all?view=calendar&cal=week&event=denver');
    expect(label()).toBe('Dec 9 – Dec 15, 2030');
    expect(inGrid('denver')?.className).toMatch(/cardHighlight/);
    expect(screen.getByTestId('event-drawer')).toHaveAttribute('data-uid', 'denver');
  });

  it('opens the drawer from a card', () => {
    renderPage({}, '/events/all?view=calendar&cal=week');
    fireEvent.click(inGrid('lis1') as HTMLElement);
    expect(storeParams().get('event')).toBe('lis1');
    expect(screen.getByTestId('event-drawer')).toHaveAttribute('data-uid', 'lis1');
  });

  it('keeps the filters, and says when nothing matches', () => {
    renderPage({}, '/events/all?view=calendar&cal=week&mode=Virtual');
    // Today's week, although its only online event is next week (LAB-3353: no jump to the first busy week).
    expect(label()).toBe('Nov 25 – Dec 1, 2030');
    expect(within(calendar()).getByText('Nothing this week.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Next week' }));
    expect(label()).toBe('Dec 2 – Dec 8, 2030');
    expect(inGrid('call')).not.toBeNull();
    expect(inGrid('lis2')).toBeNull();
  });

  it('shows the empty state with no match', () => {
    renderPage({}, '/events/all?view=calendar&search=zzz');
    expect(screen.queryByTestId('events-calendar')).toBeNull();
    expect(screen.getByText('No upcoming events match')).toBeInTheDocument();
  });
});

/* Review fixes (LAB-3247): analytics that never drop a change, the city header, and the no-Map and unknown-event links. */
describe('review fixes', () => {
  it('still records a filter change when the member opens an event right after', async () => {
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: /^Paris/ }));
    fireEvent.click(card('Paris meetup'));
    expect(storeParams().get('event')).toBe('paris');
    act(() => jest.advanceTimersByTime(400));
    await waitFor(() =>
      expect(analytics.onEventsFiltersApplied).toHaveBeenCalledWith({ key: 'city', values: ['Paris'] }),
    );
  });

  it('records each cleared filter by its own key', () => {
    renderPage({}, '/events/all?mode=Hybrid&city=Dubai');
    fireEvent.click(screen.getByRole('button', { name: 'Clear all' }));
    expect(analytics.onEventsFiltersApplied).toHaveBeenCalledWith({ key: 'mode', values: [] });
    expect(analytics.onEventsFiltersApplied).toHaveBeenCalledWith({ key: 'city', values: [] });
    expect(analytics.onEventsFiltersApplied).not.toHaveBeenCalledWith(expect.objectContaining({ key: 'all' }));
  });

  it('gives the city header the dates of the events it counts', () => {
    renderPage({}, '/events/all?city=Lisbon&search=event%204');
    expect(screen.getByText(/^1 upcoming event · Dec 4 · Times in Lisbon time/)).toBeInTheDocument();
  });

  it('opens the List for `?view=map` while there is no Map', () => {
    renderPage({}, '/events/all?view=map');
    expect(screen.getByRole('tab', { name: /List/, selected: true })).toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: /Map/ })).toBeNull();
    expect(screen.queryByTestId('events-calendar')).toBeNull();
  });

  it('hands an unknown linked event to the drawer and marks nothing', () => {
    const { container } = renderPage({}, '/events/all?view=calendar&cal=week&event=gone');
    expect(screen.getByTestId('event-drawer')).toHaveAttribute('data-uid', 'gone');
    expect(container.querySelector('[class*="ighlight"]')).toBeNull();
    expect(within(screen.getByTestId('events-calendar')).getByRole('heading', { level: 3 }).textContent).toBe(
      'Nov 25 – Dec 1, 2030',
    );
  });
});

describe('Calendar defaults, past days and faces (LAB-3353)', () => {
  const calendar = () => screen.getByTestId('events-calendar');
  const label = () => within(calendar()).getByRole('heading', { level: 3 }).textContent;
  const width = window.innerWidth;
  const setWidth = (px: number) => Object.defineProperty(window, 'innerWidth', { configurable: true, value: px });
  afterEach(() => setWidth(width));

  it('opens Week under 960px', () => {
    setWidth(959);
    renderPage({}, '/events/all?view=calendar');
    expect(within(calendar()).getByRole('tab', { name: 'Week', selected: true })).toBeInTheDocument();
    expect(label()).toBe('Nov 25 – Dec 1, 2030');
  });

  it('opens Month from 960px', () => {
    setWidth(960);
    renderPage({}, '/events/all?view=calendar');
    expect(within(calendar()).getByRole('tab', { name: 'Month', selected: true })).toBeInTheDocument();
  });

  it('lets `cal` in the address win over the width, and writes the switch both ways', () => {
    renderPage({}, '/events/all?view=calendar&cal=week');
    expect(within(calendar()).getByRole('tab', { name: 'Week', selected: true })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('tab', { name: 'Month' }));
    expect(storeParams().get('cal')).toBe('month');
    fireEvent.click(screen.getByRole('tab', { name: 'Week' }));
    expect(storeParams().get('cal')).toBe('week');
  });

  it('opens on a phone in Month when the address says so', () => {
    setWidth(400);
    renderPage({}, '/events/all?view=calendar&cal=month');
    expect(label()).toBe('December 2030');
  });

  it('opens at today’s month and week, even when the next event is months away', () => {
    const later = [item({ uid: 'feb', name: 'February meetup', startDay: '2031-02-12', endDay: '2031-02-12' })];
    const { unmount } = renderPage({ result: { ok: true, items: later } }, '/events/all?view=calendar');
    expect(label()).toBe('December 2030');
    unmount();
    renderPage({ result: { ok: true, items: later } }, '/events/all?view=calendar&cal=week');
    expect(label()).toBe('Nov 25 – Dec 1, 2030');
    expect(within(calendar()).getByText('Nothing this week.')).toBeInTheDocument();
  });

  it('greys the days before today in Month and in Week, and only those', () => {
    // Today is Sunday, December 1: Monday 25 to Saturday 30 November are past.
    const past = ['2030-11-25', '2030-11-26', '2030-11-27', '2030-11-28', '2030-11-29', '2030-11-30'];
    const { unmount } = renderPage({}, '/events/all?view=calendar');
    const marked = () =>
      Array.from(calendar().querySelectorAll('[data-past-day]')).map((el) => el.getAttribute('data-past-day'));
    expect(marked()).toEqual(past);
    const dayNumbers = Array.from(calendar().querySelectorAll('[class*="dayNum"]'));
    expect(dayNumbers.filter((el) => /dayPast/.test(el.className))).toHaveLength(6);
    expect(dayNumbers.find((el) => /dayToday/.test(el.className))?.className).not.toMatch(/dayPast/);
    unmount();
    renderPage({}, '/events/all?view=calendar&cal=week');
    expect(marked()).toEqual(past);
    fireEvent.click(screen.getByRole('button', { name: 'Next week' }));
    expect(marked()).toEqual([]);
  });

  it('shows the faces and "N going" on Week cards, and nothing at 0 or with attendance hidden', () => {
    const faces = [
      { uid: 'f1', name: 'Ann', image: null },
      { uid: 'f2', name: 'Bo', image: 'https://img.example/bo.png' },
      { uid: 'f3', name: 'Cy', image: null },
    ];
    const events = [
      item({ uid: 'five', name: 'Five going', startDay: '2030-12-03', endDay: '2030-12-03', goingCount: 5, faces }),
      item({
        uid: 'span',
        name: 'Two days',
        startDay: '2030-12-04',
        endDay: '2030-12-05',
        goingCount: 2,
        faces: faces.slice(0, 2),
      }),
      item({ uid: 'none', name: 'Nobody yet', startDay: '2030-12-03', endDay: '2030-12-03', goingCount: 0 }),
      item({ uid: 'hidden', name: 'Invite only', startDay: '2030-12-03', endDay: '2030-12-03', goingCount: null }),
    ];
    renderPage({ result: { ok: true, items: events } }, '/events/all?view=calendar&cal=week');
    fireEvent.click(screen.getByRole('button', { name: 'Next week' }));
    const card = (uid: string) =>
      calendar().querySelector(`[class*="boardGrid"] [data-event-uid="${uid}"]`) as HTMLElement;
    expect(within(card('five')).getByText('5 going')).toBeInTheDocument();
    expect(card('five').querySelectorAll('img')).toHaveLength(3);
    expect(within(card('span')).getByText('2 going')).toBeInTheDocument();
    expect(card('none').textContent).not.toMatch(/going/);
    expect(card('hidden').textContent).not.toMatch(/going/);
  });
});
