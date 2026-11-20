import {
  getAllEventsPageEvents,
  getMemberProfileCity,
  toAllEventsItem,
  toDisplayCity,
  toZoneLabel,
  upcomingOnly,
} from '@/services/events/all-events.service';
import type { EventListItemResponse } from '@/services/events/all-events.types';

/* The All Events page's server loader (`GET /v1/irl/events`, page by page) and its mapping. */

const row = (over: Partial<EventListItemResponse> = {}): EventListItemResponse => ({
  uid: 'e1',
  name: 'DAI Summit',
  startDate: '2030-12-03T03:30:00.000Z',
  endDate: '2030-12-04T12:30:00.000Z',
  allDay: false,
  timezone: 'Asia/Kolkata',
  format: 'HYBRID',
  accessOption: 'PAID',
  tags: ['AI'],
  isFeatured: false,
  logo: 'https://img/logo.png',
  banner: 'https://img/banner.png',
  host: { name: 'Protocol Labs', logo: null },
  gathering: { uid: 'loc-1', city: 'bangalore', country: 'India' },
  venue: { address: '12 MG Road', latitude: 12.97, longitude: 77.59 },
  goingCount: 12,
  faces: [
    { uid: 'm1', name: 'Ann', image: null },
    { uid: 'm2', name: 'Bo', image: null },
    { uid: 'm3', name: 'Cy', image: null },
    { uid: 'm4', name: 'Di', image: null },
  ],
  ...over,
});

describe('toAllEventsItem', () => {
  it('reads time, day, zone, place, mode, access, host and tags in the event’s own time zone', () => {
    const item = toAllEventsItem(row());
    expect(item).toMatchObject({
      allDay: false,
      timezone: 'Asia/Kolkata',
      startDay: '2030-12-03',
      endDay: '2030-12-04',
      startTime: '9:00 AM',
      endTime: '6:00 PM',
      zone: 'UTC+5:30',
      city: 'Bangalore',
      cityKey: 'bangalore',
      place: 'Bangalore, India',
      mode: 'Hybrid',
      access: 'PAID',
      hosts: ['Protocol Labs'],
      tags: ['AI'],
      featured: false,
      picture: 'https://img/banner.png',
      goingCount: 12,
    });
    expect(item.faces).toHaveLength(3);
  });

  it('maps each format and access value to the words the cards use', () => {
    expect(toAllEventsItem(row({ format: 'IN_PERSON', accessOption: 'OPEN' }))).toMatchObject({
      mode: 'In-Person',
      access: 'FREE w/ RSVP',
    });
    expect(toAllEventsItem(row({ format: 'VIRTUAL', accessOption: 'INVITE' }))).toMatchObject({
      mode: 'Virtual',
      access: 'INVITE ONLY',
    });
    expect(toAllEventsItem(row({ format: null, accessOption: null }))).toMatchObject({ mode: null, access: null });
  });

  it('lists the host first, then the co-hosts, each once', () => {
    const coHosts = [{ name: 'Filecoin Foundation' }, { name: 'Protocol Labs' }];
    expect(toAllEventsItem(row({ coHosts })).hosts).toEqual(['Protocol Labs', 'Filecoin Foundation']);
  });

  it('carries the featured mark', () => {
    expect(toAllEventsItem(row({ isFeatured: true })).featured).toBe(true);
  });

  it('gives an all-day event its days and no time or zone', () => {
    const item = toAllEventsItem(row({ allDay: true, startDate: '2030-07-24', endDate: '2030-07-26' }));
    expect(item).toMatchObject({
      allDay: true,
      startDay: '2030-07-24',
      endDay: '2030-07-26',
      startTime: '',
      endTime: '',
      zone: '',
    });
  });

  it('reads a virtual event with no gathering, venue, host or time zone', () => {
    const item = toAllEventsItem(
      row({ format: 'VIRTUAL', gathering: null, venue: null, host: null, timezone: null, tags: [], banner: null }),
    );
    expect(item).toMatchObject({
      timezone: 'UTC',
      zone: 'UTC+0',
      city: null,
      cityKey: null,
      place: null,
      mode: 'Virtual',
      hosts: [],
      tags: [],
      picture: 'https://img/logo.png',
    });
  });

  it('turns the "Others" gathering into no city', () => {
    const item = toAllEventsItem(row({ gathering: { uid: 'loc-9', city: 'Others', country: null } }));
    expect(item.city).toBeNull();
    expect(item.place).toBeNull();
  });

  it('hides attendance when the event hides it', () => {
    const item = toAllEventsItem(row({ goingCount: null }));
    expect(item.goingCount).toBeNull();
    expect(item.faces).toEqual([]);
  });
});

describe('labels', () => {
  it('title-cases an all-lower-case city and keeps a cased one', () => {
    expect(toDisplayCity('new york')).toBe('New York');
    expect(toDisplayCity('San Francisco, USA')).toBe('San Francisco');
    expect(toDisplayCity('')).toBeNull();
    expect(toDisplayCity(null)).toBeNull();
  });

  it('prints UTC offsets as the prototype does', () => {
    const d = new Date('2030-12-03T12:00:00.000Z');
    expect(toZoneLabel(d, 'UTC')).toBe('UTC+0');
    expect(toZoneLabel(d, 'Asia/Kolkata')).toBe('UTC+5:30');
    expect(toZoneLabel(d, 'America/Sao_Paulo')).toBe('UTC−3');
  });
});

describe('upcomingOnly', () => {
  const now = new Date('2030-12-03T12:00:00.000Z');

  it('drops an event that ended and sorts the rest soonest first', () => {
    const items = [
      toAllEventsItem(
        row({ uid: 'later', startDate: '2030-12-10T09:00:00.000Z', endDate: '2030-12-10T18:00:00.000Z' }),
      ),
      toAllEventsItem(
        row({ uid: 'ended', startDate: '2030-12-01T09:00:00.000Z', endDate: '2030-12-02T18:00:00.000Z' }),
      ),
      toAllEventsItem(
        row({ uid: 'running', startDate: '2030-12-02T09:00:00.000Z', endDate: '2030-12-05T18:00:00.000Z' }),
      ),
    ];
    expect(upcomingOnly(items, now).map((i) => i.uid)).toEqual(['running', 'later']);
  });

  it('keeps an all-day event until the end of its last day in its time zone', () => {
    const allDay = (uid: string, endDate: string) =>
      toAllEventsItem(row({ uid, allDay: true, startDate: '2030-12-01', endDate, timezone: 'UTC' }));
    expect(
      upcomingOnly([allDay('today', '2030-12-03'), allDay('yesterday', '2030-12-02')], now).map((i) => i.uid),
    ).toEqual(['today']);
  });
});

describe('getAllEventsPageEvents', () => {
  const realFetch = global.fetch;
  afterEach(() => {
    global.fetch = realFetch;
  });

  const json = (body: unknown, status = 200) =>
    Promise.resolve({ ok: status < 400, status, json: () => Promise.resolve(body) } as Response);
  const pageOf = (url: string) => Number(new URL(url).searchParams.get('page'));

  beforeAll(() => {
    process.env.DIRECTORY_API_URL = 'https://api.test';
  });

  it('reads the list page by page until the total is reached', async () => {
    const fetchMock = jest.fn((url: string) =>
      pageOf(url) === 1
        ? json({ page: 1, limit: 100, total: 3, items: [row({ uid: 'a' }), row({ uid: 'b' })] })
        : json({ page: 2, limit: 100, total: 3, items: [row({ uid: 'c' })] }),
    );
    global.fetch = fetchMock as unknown as typeof fetch;

    const result = await getAllEventsPageEvents();
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.items.map((i) => i.uid)).toEqual(['a', 'b', 'c']);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      'https://api.test/v1/irl/events?page=1&limit=100',
      'https://api.test/v1/irl/events?page=2&limit=100',
    ]);
  });

  it('returns no events for an empty list, with one call', async () => {
    const fetchMock = jest.fn(() => json({ page: 1, limit: 100, total: 0, items: [] }));
    global.fetch = fetchMock as unknown as typeof fetch;
    expect(await getAllEventsPageEvents()).toEqual({ ok: true, items: [] });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('reports a failure when the list request fails', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    global.fetch = jest.fn(() => json({}, 502)) as unknown as typeof fetch;
    expect(await getAllEventsPageEvents()).toEqual({ ok: false });
  });

  it('reports a failure when a later page fails, instead of a partial list', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    global.fetch = jest.fn((url: string) =>
      pageOf(url) === 1 ? json({ page: 1, limit: 100, total: 150, items: [row({ uid: 'a' })] }) : json({}, 500),
    ) as unknown as typeof fetch;
    expect(await getAllEventsPageEvents()).toEqual({ ok: false });
  });
});

describe('getMemberProfileCity', () => {
  const realFetch = global.fetch;
  afterEach(() => {
    global.fetch = realFetch;
  });

  const respond = (body: unknown, ok = true) =>
    jest.fn(() => Promise.resolve({ ok, json: () => Promise.resolve(body) })) as unknown as typeof fetch;

  it('reads the city, null without a location, undefined when the call fails', async () => {
    global.fetch = respond({ location: { city: ' Lisbon ' } });
    expect(await getMemberProfileCity('m1', 't')).toBe('Lisbon');
    global.fetch = respond({ location: null });
    expect(await getMemberProfileCity('m1', 't')).toBeNull();
    global.fetch = respond({ location: { city: null, metroArea: null, region: null, country: null } });
    expect(await getMemberProfileCity('m1', 't')).toBeNull();
    global.fetch = respond({}, false);
    expect(await getMemberProfileCity('m1', 't')).toBeUndefined();
  });

  it('falls back to the metro area, region or country when the location has no city', async () => {
    global.fetch = respond({ location: { city: null, metroArea: 'Kyiv', country: 'Ukraine' } });
    expect(await getMemberProfileCity('m1', 't')).toBe('Kyiv');
    global.fetch = respond({
      location: { city: ' ', metroArea: null, region: 'Pennsylvania', country: 'United States' },
    });
    expect(await getMemberProfileCity('m1', 't')).toBe('Pennsylvania');
    global.fetch = respond({ location: { city: null, metroArea: null, region: null, country: 'Slovenia' } });
    expect(await getMemberProfileCity('m1', 't')).toBe('Slovenia');
  });
});
