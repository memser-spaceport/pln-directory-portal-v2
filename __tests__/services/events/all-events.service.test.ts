import {
  getAllEventsPageEvents,
  getMemberProfileCity,
  toAllEventsItem,
  toDisplayCity,
  toZoneLabel,
  upcomingOnly,
} from '@/services/events/all-events.service';
import type { EventDetailResponse } from '@/services/events/event-drawer.types';
import type { UpcomingEvent } from '@/services/events/hooks/useUpcomingEvents';

/* LAB-3247 (design D2): the All Events page's server loader and its mapping. */

const row = (over: Partial<UpcomingEvent> = {}): UpcomingEvent => ({
  uid: 'e1',
  name: 'DAI Summit',
  logo: 'https://img/logo.png',
  location: 'bangalore',
  flag: '',
  startDate: '2030-12-03T03:30:00.000Z',
  endDate: '2030-12-04T12:30:00.000Z',
  websiteUrl: '',
  locationUid: 'loc-1',
  goingCount: 12,
  ...over,
});

const detail = (over: Partial<EventDetailResponse> = {}): EventDetailResponse => ({
  uid: 'e1',
  name: 'DAI Summit',
  slugURL: 'dai-summit',
  type: 'HYBRID',
  startDate: '2030-12-03T03:30:00.000Z',
  endDate: '2030-12-04T12:30:00.000Z',
  description: null,
  shortDescription: null,
  logo: 'https://img/logo.png',
  banner: 'https://img/banner.png',
  websiteUrl: null,
  externalId: null,
  resources: [],
  location: {
    uid: 'loc-1',
    location: 'Bangalore, India',
    city: null,
    flag: null,
    timezone: 'Asia/Kolkata',
    resources: [],
    events: [],
  },
  details: {
    tags: [{ name: 'AI', color: null }],
    accessType: null,
    accessOption: 'PAID',
    format: null,
    host: { name: 'Protocol Labs', logo: null },
    coHosts: [],
    sponsors: [],
    agenda: null,
  },
  hosts: [],
  goingCount: 12,
  faces: [
    { uid: 'm1', name: 'Ann', image: null },
    { uid: 'm2', name: 'Bo', image: null },
    { uid: 'm3', name: 'Cy', image: null },
    { uid: 'm4', name: 'Di', image: null },
  ],
  viewerGoing: false,
  viewer: null,
  ...over,
});

describe('toAllEventsItem', () => {
  it('reads time, day, zone, place, mode, access, hosts and tags in the event’s own time zone', () => {
    const item = toAllEventsItem(row(), detail());
    expect(item).toMatchObject({
      timezone: 'Asia/Kolkata',
      startDay: '2030-12-03',
      endDay: '2030-12-04',
      startTime: '9:00 AM',
      zone: 'UTC+5:30',
      city: 'Bangalore',
      cityKey: 'bangalore',
      place: 'Bangalore, India',
      mode: 'Hybrid',
      access: 'PAID',
      hosts: ['Protocol Labs'],
      tags: ['AI'],
      picture: 'https://img/banner.png',
      goingCount: 12,
    });
    expect(item.faces).toHaveLength(3);
  });

  it('carries the first topic’s colour for the calendar', () => {
    const base = detail();
    const tags = [
      { name: 'AI', color: '#FF8800' },
      { name: 'Storage', color: '#00AA00' },
    ];
    expect(toAllEventsItem(row(), detail({ details: { ...base.details!, tags } })).tagColor).toBe('#FF8800');
    expect(toAllEventsItem(row(), base).tagColor).toBeNull();
  });

  it('keeps the list fields when the detail call failed', () => {
    const item = toAllEventsItem(row(), null);
    expect(item).toMatchObject({
      uid: 'e1',
      name: 'DAI Summit',
      timezone: 'UTC',
      startDay: '2030-12-03',
      zone: 'UTC+0',
      city: 'Bangalore',
      mode: null,
      access: null,
      hosts: [],
      picture: 'https://img/logo.png',
      goingCount: 12,
      faces: [],
    });
  });

  it('turns the "Others" gathering into no city', () => {
    const item = toAllEventsItem(row({ location: 'Others' }), detail({ location: null }));
    expect(item.city).toBeNull();
    expect(item.cityKey).toBeNull();
  });

  it('hides attendance when the list says the event hides it, even if the detail says 0', () => {
    const item = toAllEventsItem(row({ goingCount: null }), detail({ goingCount: 0 }));
    expect(item.goingCount).toBeNull();
    expect(item.faces).toEqual([]);
  });
});

describe('labels', () => {
  it('title-cases an all-lower-case city and keeps a cased one', () => {
    expect(toDisplayCity('new york')).toBe('New York');
    expect(toDisplayCity('abu dhabi, UAE')).toBe('Abu Dhabi');
    expect(toDisplayCity('San Francisco, CA')).toBe('San Francisco');
    expect(toDisplayCity('  ')).toBeNull();
  });

  it('prints UTC offsets as the prototype does', () => {
    const d = new Date('2030-01-15T12:00:00Z');
    expect(toZoneLabel(d, 'UTC')).toBe('UTC+0');
    expect(toZoneLabel(d, 'Asia/Kolkata')).toBe('UTC+5:30');
    expect(toZoneLabel(d, 'America/Sao_Paulo')).toBe('UTC−3');
  });
});

describe('upcomingOnly', () => {
  it('drops an event that ended and sorts the rest soonest first', () => {
    const now = new Date('2030-06-10T12:00:00Z');
    const ended = toAllEventsItem(
      row({ uid: 'past', startDate: '2030-06-09T08:00:00Z', endDate: '2030-06-09T18:00:00Z' }),
      null,
    );
    const later = toAllEventsItem(
      row({ uid: 'later', startDate: '2030-06-20T08:00:00Z', endDate: '2030-06-20T18:00:00Z' }),
      null,
    );
    const underway = toAllEventsItem(
      row({ uid: 'now', startDate: '2030-06-09T08:00:00Z', endDate: '2030-06-11T18:00:00Z' }),
      null,
    );
    expect(upcomingOnly([later, ended, underway], now).map((i) => i.uid)).toEqual(['now', 'later']);
  });
});

describe('getAllEventsPageEvents', () => {
  const realFetch = global.fetch;
  afterEach(() => {
    global.fetch = realFetch;
  });

  const json = (body: unknown, status = 200) =>
    Promise.resolve({ ok: status < 400, status, json: () => Promise.resolve(body) } as Response);

  it('loads every upcoming event and its detail; a failed detail keeps the event', async () => {
    global.fetch = jest.fn((url: string) => {
      if (url.endsWith('/v1/irl/events/upcoming')) return json([row({ uid: 'a' }), row({ uid: 'b' })]);
      if (url.endsWith('/v1/irl/events/a')) return json(detail({ uid: 'a' }));
      return json({ message: 'boom' }, 500);
    }) as unknown as typeof fetch;

    const result = await getAllEventsPageEvents();
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.items.map((i) => [i.uid, i.mode])).toEqual([
      ['a', 'Hybrid'],
      ['b', null],
    ]);
  });

  it('reports a failure when the upcoming list itself fails', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    global.fetch = jest.fn(() => json({}, 502)) as unknown as typeof fetch;
    expect(await getAllEventsPageEvents()).toEqual({ ok: false });
  });
});

describe('getMemberProfileCity', () => {
  const realFetch = global.fetch;
  afterEach(() => {
    global.fetch = realFetch;
  });

  it('reads the city, null without one, undefined when the call fails', async () => {
    const respond = (body: unknown, ok = true) =>
      jest.fn(() => Promise.resolve({ ok, json: () => Promise.resolve(body) })) as unknown as typeof fetch;

    global.fetch = respond({ location: { city: ' Lisbon ' } });
    expect(await getMemberProfileCity('m1', 't')).toBe('Lisbon');
    global.fetch = respond({ location: null });
    expect(await getMemberProfileCity('m1', 't')).toBeNull();
    global.fetch = respond({}, false);
    expect(await getMemberProfileCity('m1', 't')).toBeUndefined();
  });
});
