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

  it('steps aside once a filter is applied', () => {
    renderPage(signedIn('Lisbon'), '/events/all?mode=Virtual');
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
