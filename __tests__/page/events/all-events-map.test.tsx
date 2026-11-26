import React from 'react';
import '@testing-library/jest-dom';
import { act, fireEvent, render, screen, within } from '@testing-library/react';

import { AllEventsPage } from '@/components/page/events/all-events/AllEventsPage';
import { EventsMap } from '@/components/page/events/all-events/map/EventsMap';
import type { GoogleMapsLibs } from '@/components/page/events/all-events/map/google-maps.types';
import {
  CITY_ZOOM,
  EVENT_PIN_ZOOM,
  WORLD,
  eventPins,
  mapCamera,
  mapLayout,
  spreadOffsets,
} from '@/components/page/events/all-events/map/pins';
import { useAllEventsFilterStore } from '@/services/events/all-events-filters.store';
import { allEventsItem as item } from '@/services/events/all-events.fixtures';
import type { AllEventsItem } from '@/services/events/all-events.types';

/*
 * LAB-3247 slice C (LAB-3321): the Map view. Google Maps is replaced by fakes that record what the map was asked to do;
 * the pins are React portals into each marker's content, so they are queried in the document.
 */

jest.mock('@/utils/events-page', () => ({
  SHOW_EVENTS_PAGE_V2: true,
  HAS_EVENTS_MAP: true,
  GOOGLE_MAPS_API_KEY: 'test-key',
  GOOGLE_MAPS_MAP_ID: 'test-map-id',
}));

type LatLng = { lat: number; lng: number };

class FakeMap {
  zoom = 2;
  center: LatLng | null = null;
  fitted: LatLng[] | null = null;
  listeners: Record<string, Array<() => void>> = {};
  constructor(
    public el: HTMLElement,
    public options: Record<string, unknown>,
  ) {
    mockGoogle.maps.push(this);
  }
  setZoom(zoom: number) {
    this.zoom = zoom;
    this.listeners.zoom_changed?.forEach((f) => f());
  }
  getZoom() {
    return this.zoom;
  }
  setCenter(center: LatLng) {
    this.center = center;
  }
  fitBounds(bounds: FakeBounds) {
    this.fitted = bounds.points;
  }
  addListener(name: string, f: () => void) {
    (this.listeners[name] ??= []).push(f);
    return { remove: jest.fn() };
  }
}
class FakeMarker {
  map: FakeMap | null = null;
  zIndex: number | null = null;
  position: LatLng | null = null;
  content: HTMLElement | null = null;
  title = '';
  press?: () => void;
  constructor(options: { map: FakeMap; position: LatLng; content: HTMLElement; title: string }) {
    Object.assign(this, options);
    document.body.appendChild(options.content);
    mockGoogle.markers.push(this);
  }
  addEventListener(_name: string, f: () => void) {
    this.press = f;
  }
}
class FakeBounds {
  points: LatLng[] = [];
  extend(point: LatLng) {
    this.points.push(point);
    return this;
  }
}
const mockGoogle = {
  maps: [] as FakeMap[],
  markers: [] as FakeMarker[],
  load: jest.fn(),
};
jest.mock('@/components/page/events/all-events/map/loadGoogleMaps', () => ({
  loadGoogleMaps: (key: string) => mockGoogle.load(key),
}));
/** The fakes stand in for Google's classes; only what the map calls is implemented. */
const libs = { Map: FakeMap, AdvancedMarkerElement: FakeMarker, LatLngBounds: FakeBounds } as unknown as GoogleMapsLibs;

const DUBAI: [number, number] = [25.2, 55.3];
const LISBON: [number, number] = [38.72, -9.14];
const mockCoords = {
  state: { data: undefined as Record<string, [number, number]> | undefined, isPending: false, isError: false },
};
jest.mock('@/services/events/hooks/useCityCoords', () => ({
  useCityCoords: () => ({ ...mockCoords.state, refetch: jest.fn() }),
}));

// The page's own collaborators, as in all-events-page.test.tsx.
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), prefetch: jest.fn(), refresh: jest.fn() }),
  usePathname: () => '/events/all',
  useSearchParams: () => new URLSearchParams(window.location.search),
}));
jest.mock('next/dynamic', () => () => () => null);
jest.mock('@/components/page/events/EventDrawer/EventDrawer', () => ({ EventDrawer: () => null }));
jest.mock('@/analytics/events.analytics', () => ({
  useEventsAnalytics: () => ({
    onEventsViewChanged: jest.fn(),
    onEventsFiltersApplied: jest.fn(),
    onEventsCitySelected: jest.fn(),
    onSubmitEventButtonClicked: jest.fn(),
    onGoToEventsButtonClicked: jest.fn(),
  }),
}));
jest.mock('@/services/events/hooks/useMyUpcomingEventUids', () => ({ useMyUpcomingEventUids: () => ({ data: [] }) }));
jest.mock('@/services/events/hooks/usePastEvents', () => ({ usePastEvents: () => ({ data: [] }) }));
jest.mock('@/services/events/hooks/useMyPastEventUids', () => ({ useMyPastEventUids: () => ({ data: [] }) }));
jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useQueryClient: () => ({ setQueryData: jest.fn() }),
}));
jest.mock('@/services/events/hooks/useEventDrawerQueries', () => ({ usePrefetchEventDetail: () => jest.fn() }));
jest.mock('@/components/core/ToastContainer', () => ({ toast: { success: jest.fn() } }));
// The Calendar's month picker (LAB-3460) is react-calendar, which ships ESM only; its own suite has a stand-in.
jest.mock('react-calendar', () => ({ __esModule: true, default: () => null }));

function events(): AllEventsItem[] {
  return [
    item({ uid: 'lis1', name: 'Lisbon breakfast', startDate: '2030-12-02T09:00:00Z', startDay: '2030-12-02' }),
    ...[1, 2, 3].map((n) =>
      item({
        uid: `dub${n}`,
        name: `Dubai event ${n}`,
        city: 'Dubai',
        place: 'Dubai',
        mode: n === 1 ? 'Hybrid' : 'In-Person',
        startDate: `2030-12-1${n}T09:00:00Z`,
        startDay: `2030-12-1${n}`,
        endDay: `2030-12-1${n}`,
      }),
    ),
    item({ uid: 'call', name: 'Community Call', city: null, place: null, mode: 'Virtual' }),
    item({ uid: 'south', name: 'South India meetup', city: 'South India', place: 'South India' }),
  ];
}

const map = () => mockGoogle.maps[mockGoogle.maps.length - 1];
const marker = (city: string) => mockGoogle.markers.find((m) => m.map && m.title.startsWith(`${city}:`)) as FakeMarker;
const pin = (key: string) => document.querySelector(`[data-city="${key}"]`) as HTMLElement;
/** An event's marker, on the map or not, by the event's name. */
const eventMarker = (name: string) => mockGoogle.markers.find((m) => m.title.startsWith(`${name},`)) as FakeMarker;
const eventPin = (uid: string) => document.querySelector(`[data-event-pin="${uid}"]`) as HTMLElement;
const shownCityMarkers = () => mockGoogle.markers.filter((m) => m.map && m.title.endsWith('Zoom in to the events'));
const zoomTo = (zoom: number) => act(() => map().setZoom(zoom));

async function renderMap(props: Partial<React.ComponentProps<typeof EventsMap>> = {}) {
  const onOpen = jest.fn();
  const view = render(
    <EventsMap events={events()} goingUids={new Set()} onOpen={onOpen} onPrepare={jest.fn()} {...props} />,
  );
  await act(async () => {});
  return { ...view, onOpen };
}

beforeEach(() => {
  mockGoogle.maps = [];
  mockGoogle.markers = [];
  mockGoogle.load.mockReset();
  mockGoogle.load.mockResolvedValue(libs);
  mockCoords.state = { data: { dubai: DUBAI, lisbon: LISBON }, isPending: false, isError: false };
  document.body.innerHTML = '';
});

describe('map layout', () => {
  it('pins in-person and hybrid events by city, lists online ones and keeps unplaced ones', () => {
    const { pins, online, unplaced } = mapLayout(events(), { dubai: DUBAI, lisbon: LISBON });
    expect(pins.map((p) => [p.city, p.events.map((e) => e.uid)])).toEqual([
      ['Dubai', ['dub1', 'dub2', 'dub3']],
      ['Lisbon', ['lis1']],
    ]);
    expect(online.map((e) => e.uid)).toEqual(['call']);
    expect(unplaced.map((e) => e.uid)).toEqual(['south']);
  });

  it('looks at the linked event’s city, else the only city, else every pin, else the world', () => {
    const { pins } = mapLayout(events(), { dubai: DUBAI, lisbon: LISBON });
    expect(mapCamera(pins, 'dub2')).toEqual({ center: { lat: DUBAI[0], lng: DUBAI[1] }, zoom: CITY_ZOOM });
    expect(mapCamera(pins.slice(1))).toEqual({ center: { lat: LISBON[0], lng: LISBON[1] }, zoom: CITY_ZOOM });
    expect(mapCamera(pins)).toEqual({ fit: pins.map((p) => p.position) });
    expect(mapCamera([])).toEqual(WORLD);
  });

  it('spreads a city’s event pins so no two 48px pins touch, a lone event on its city (LAB-3353)', () => {
    expect(spreadOffsets(1)).toEqual([{ x: 0, y: 0 }]);
    expect(spreadOffsets(0)).toEqual([]);
    for (let n = 2; n <= 60; n++) {
      const at = spreadOffsets(n);
      expect(at).toHaveLength(n);
      for (let i = 0; i < n; i++)
        for (let j = i + 1; j < n; j++)
          expect(Math.hypot(at[i].x - at[j].x, at[i].y - at[j].y)).toBeGreaterThanOrEqual(52);
    }
  });

  it('gives each in-person event a pin at its city, soonest first', () => {
    const { pins } = mapLayout(events(), { dubai: DUBAI, lisbon: LISBON });
    const placed = eventPins(pins);
    expect(placed.map((p) => p.event.uid)).toEqual(['dub1', 'dub2', 'dub3', 'lis1']);
    expect(placed.filter((p) => p.event.city === 'Dubai').every((p) => p.position.lat === DUBAI[0])).toBe(true);
    expect(placed.find((p) => p.event.uid === 'lis1')?.offset).toEqual({ x: 0, y: 0 });
  });
});

describe('EventsMap', () => {
  it('draws Google’s map with greedy gestures and one counted pin per city', async () => {
    await renderMap();
    expect(mockGoogle.load).toHaveBeenCalledWith('test-key');
    expect(map().options).toMatchObject({ mapId: 'test-map-id', gestureHandling: 'greedy', disableDefaultUI: true });
    expect(marker('Dubai').title).toBe('Dubai: 3 events. Zoom in to the events');
    expect(marker('Lisbon').title).toBe('Lisbon: 1 event. Zoom in to the events');
    expect(pin('dubai')).toHaveTextContent('Dubai3');
    // Zoomed out, the events' own pins are not on the map.
    expect(eventMarker('Dubai event 1').map).toBeNull();
    expect(eventPin('dub1')).toBeNull();
    expect(map().fitted).toEqual([
      { lat: DUBAI[0], lng: DUBAI[1] },
      { lat: LISBON[0], lng: LISBON[1] },
    ]);
  });

  it('lists online events and events with no place under the map', async () => {
    await renderMap();
    const online = screen.getByRole('region', { name: 'Online · 1' });
    expect(within(online).getByRole('button', { name: /Community Call/ })).toBeInTheDocument();
    const unplaced = screen.getByRole('region', { name: 'Not on the map · 1' });
    expect(within(unplaced).getByRole('button', { name: /South India meetup/ })).toBeInTheDocument();
  });

  it('zooms into a city from its pin, where each event has a picture pin that opens its drawer (LAB-3353)', async () => {
    const { onOpen } = await renderMap();
    act(() => marker('Dubai').press?.());
    expect(map().center).toEqual({ lat: DUBAI[0], lng: DUBAI[1] });
    expect(map().zoom).toBe(CITY_ZOOM);
    expect(onOpen).not.toHaveBeenCalled();

    expect(shownCityMarkers()).toHaveLength(0);
    expect(eventMarker('Dubai event 2').map).toBe(map());
    expect(eventMarker('Dubai event 2').title).toBe('Dubai event 2, Dec 12');
    const at = (uid: string) => ['--dx', '--dy'].map((v) => eventPin(uid).style.getPropertyValue(v)).join(',');
    expect(new Set(['dub1', 'dub2', 'dub3'].map(at)).size).toBe(3);
    expect(eventPin('dub1').querySelector('[data-testid="event-image-placeholder"]')).not.toBeNull();

    act(() => eventMarker('Dubai event 2').press?.());
    expect(onOpen).toHaveBeenCalledWith('dub2');
  });

  it('splits every city into event pins past the city level, and joins them back when zoomed out', async () => {
    await renderMap();
    zoomTo(EVENT_PIN_ZOOM - 1);
    expect(shownCityMarkers()).toHaveLength(2);
    zoomTo(EVENT_PIN_ZOOM);
    expect(shownCityMarkers()).toHaveLength(0);
    expect(['dub1', 'dub2', 'dub3', 'lis1'].every((uid) => eventPin(uid))).toBe(true);
    zoomTo(EVENT_PIN_ZOOM - 1);
    expect(shownCityMarkers()).toHaveLength(2);
    expect(eventMarker('Lisbon breakfast').map).toBeNull();
  });

  it('marks the city, then the event, the viewer is going to', async () => {
    await renderMap({ goingUids: new Set(['dub3']) });
    expect(pin('dubai')).toHaveAttribute('data-going', 'true');
    expect(marker('Dubai').title).toBe("Dubai: 3 events, you're going. Zoom in to the events");
    expect(pin('lisbon')).not.toHaveAttribute('data-going');
    zoomTo(CITY_ZOOM);
    expect(eventPin('dub3')).toHaveAttribute('data-going', 'true');
    expect(eventPin('dub3').className).toMatch(/eventPinGoing/);
    expect(eventMarker('Dubai event 3').title).toBe("Dubai event 3, Dec 13, you're going");
    expect(eventPin('dub2')).not.toHaveAttribute('data-going');
  });

  it('zooms with + and −, and Show all fits every pin again', async () => {
    await renderMap();
    fireEvent.click(screen.getByRole('button', { name: 'Zoom in' }));
    fireEvent.click(screen.getByRole('button', { name: 'Zoom in' }));
    fireEvent.click(screen.getByRole('button', { name: 'Zoom out' }));
    expect(map().zoom).toBe(3);
    expect(screen.getByRole('slider', { name: 'Zoom' })).toHaveValue('3');

    map().fitted = null;
    fireEvent.click(screen.getByRole('button', { name: 'Show all' }));
    expect(map().fitted).toHaveLength(2);
  });

  it('centres a linked event’s city on its event pins, with the linked one in the brand ring on top', async () => {
    await renderMap({ highlightUid: 'dub2' });
    expect(map().center).toEqual({ lat: DUBAI[0], lng: DUBAI[1] });
    expect(map().zoom).toBe(CITY_ZOOM);
    expect(eventPin('dub2')).toHaveAttribute('data-active', 'true');
    expect(eventPin('dub2').className).toMatch(/eventPinActive/);
    expect(eventMarker('Dubai event 2').zIndex).toBe(1);
    expect(eventPin('dub1')).not.toHaveAttribute('data-active');
  });

  it('shows the faces and "N going" on the rows under the map', async () => {
    const withFaces = events().map((e) =>
      e.uid === 'call' ? { ...e, goingCount: 4, faces: [{ uid: 'f1', name: 'Ann', image: null }] } : e,
    );
    await renderMap({ events: withFaces });
    const row = within(screen.getByRole('region', { name: 'Online · 1' })).getByRole('button', {
      name: /Community Call/,
    });
    expect(within(row).getByText('4 going')).toBeInTheDocument();
    expect(row.querySelectorAll('img')).toHaveLength(1);
    const unplaced = within(screen.getByRole('region', { name: 'Not on the map · 1' })).getByRole('button');
    expect(unplaced.textContent).not.toMatch(/going/);
  });

  it('on Past: the same pins and lists, newest first, with years and "went" (LAB-3418)', async () => {
    const past = [
      item({
        uid: 'old',
        name: 'Old call',
        city: null,
        mode: 'Virtual',
        startDay: '2028-12-30',
        endDay: '2029-01-02',
        startDate: '2028-12-30T09:00:00Z',
        goingCount: 4,
      }),
      item({
        uid: 'new',
        name: 'New call',
        city: null,
        mode: 'Virtual',
        startDay: '2030-11-01',
        endDay: '2030-11-01',
        startDate: '2030-11-01T09:00:00Z',
        goingCount: 2,
      }),
      item({ uid: 'lis', name: 'Lisbon day', startDay: '2029-05-05', endDay: '2029-05-05' }),
    ];
    await renderMap({ events: past, pastAsOf: '2030-11-25', goingUids: new Set(['old', 'lis']) });
    const rows = Array.from(document.querySelectorAll('ul [data-event-uid]'));
    expect(rows.map((row) => row.getAttribute('data-event-uid'))).toEqual(['new', 'old']);
    expect(rows[0]).toHaveTextContent(/^Nov 1New call2 went$/);
    expect(rows[1]).toHaveTextContent(/^Dec 30, 2028 – Jan 2, 2029Old call4 wentWent$/);
    const city = mockGoogle.markers.find((m) => m.title.startsWith('Lisbon:')) as FakeMarker;
    expect(city.title).toBe('Lisbon: 1 event, you went. Zoom in to the events');
    expect(eventMarker('Lisbon day').title).toBe('Lisbon day, May 5, 2029, you went');
  });

  it('takes the pin off when the filters leave its city out', async () => {
    const { rerender } = await renderMap();
    const lisbon = marker('Lisbon');
    rerender(
      <EventsMap
        events={events().filter((e) => e.city !== 'Lisbon')}
        goingUids={new Set()}
        onOpen={jest.fn()}
        onPrepare={jest.fn()}
      />,
    );
    await act(async () => {});
    expect(lisbon.map).toBeNull();
    expect(eventMarker('Lisbon breakfast').map).toBeNull();
    // Dubai is the only city left: the map zooms into it, on its events' pins.
    expect(map().zoom).toBe(CITY_ZOOM);
    expect(eventMarker('Dubai event 1').map).toBe(map());
  });

  it('says so when the map fails to load, and Try again loads it', async () => {
    mockGoogle.load.mockRejectedValueOnce(new Error('blocked'));
    await renderMap();
    expect(screen.getByRole('alert')).toHaveTextContent("The map couldn't load.");

    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    await act(async () => {});
    expect(mockGoogle.load).toHaveBeenCalledTimes(2);
    expect(screen.queryByRole('alert')).toBeNull();
    expect(marker('Dubai')).toBeDefined();
  });
});

describe('the page with a Maps key', () => {
  it('offers Map in the view switch, and `?view=map` opens it', async () => {
    useAllEventsFilterStore.setState({ params: new URLSearchParams(), _clearImmediate: false });
    window.history.replaceState(null, '', '/events/all?view=map');
    render(
      <AllEventsPage
        result={{ ok: true, items: events() }}
        signedIn={false}
        viewerUid={null}
        memberCity={undefined}
        serverNow={Date.now()}
        serverTodayIso="2030-12-01"
        submitHref="https://irl.example/submit"
      />,
    );
    await act(async () => {});
    expect(screen.getByRole('tab', { name: /Map/, selected: true })).toBeInTheDocument();
    expect(screen.getByTestId('events-map-canvas')).toBeInTheDocument();
    expect(marker('Dubai').title).toBe('Dubai: 3 events. Zoom in to the events');
  });
});
