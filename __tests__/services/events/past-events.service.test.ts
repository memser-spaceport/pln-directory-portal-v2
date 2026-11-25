/** @jest-environment node */
import { unstable_cache } from 'next/cache';

import { GET } from '@/app/api/events/past/route';
import { ALL_EVENTS_CACHE_TAG } from '@/services/events/all-events.service';
import { toPastEventItem } from '@/services/events/past-events.mapper';
import { PAST_EVENTS_MAX_PAGES, getStartedEvents } from '@/services/events/past-events.service';

/* LAB-3418: past events for the All Events page: the row mapping, the paged loader and its route. */

// Read before any test resets the mock: the cache is made once, when the module loads.
const cacheCall = (unstable_cache as jest.Mock).mock.calls.find(([, key]) => key?.includes('past-events-page'));

const NOW = Date.UTC(2030, 10, 25, 12);

const row = (over: Record<string, unknown> = {}) => ({
  uid: 'e1',
  name: 'DAI Summit',
  slugURL: 'dai-summit',
  type: null,
  startDate: '2029-12-03T03:30:00.000Z',
  endDate: '2029-12-04T12:30:00.000Z',
  allDay: false,
  timezone: 'Asia/Kolkata',
  format: 'HYBRID',
  accessOption: 'PAID',
  tags: ['AI', 'Storage'],
  isFeatured: false,
  logo: 'https://img/logo.png',
  banner: 'https://img/banner.png',
  host: { name: 'Protocol Labs', logo: null },
  coHosts: [{ name: 'Filecoin Foundation' }, { name: 'Protocol Labs' }],
  gathering: { uid: 'loc-1', city: 'bangalore', country: 'India' },
  venue: null,
  goingCount: 12,
  faces: ['m1', 'm2', 'm3', 'm4'].map((uid) => ({ uid, name: uid, image: null })),
  isGoing: true,
  ...over,
});

/** `n` rows with their own uids, as one page of the endpoint. */
const rows = (n: number, prefix: string) => Array.from({ length: n }, (_, i) => row({ uid: `${prefix}${i}` }));

const realFetch = global.fetch;
const fetchMock = jest.fn();
const respond = (body: unknown, status = 200) =>
  Promise.resolve({ ok: status < 400, status, json: () => Promise.resolve(body) });
/** Answers each page of the list endpoint from `pages` (1-based), with `total`. */
const serve = (pages: unknown[][], total: number) =>
  fetchMock.mockImplementation((url: string) =>
    respond({ page: 1, limit: 100, total, items: pages[Number(new URL(url).searchParams.get('page')) - 1] ?? [] }),
  );
/** A backend that never answers, but for the pages `answers` takes. Node's own timer is stood in for: `over` ends it. */
const hang = (answers: (page: number) => boolean = () => false) => {
  const controllers: AbortController[] = [];
  const spy = jest.spyOn(AbortSignal, 'timeout').mockImplementation(() => {
    controllers.push(new AbortController());
    return controllers[controllers.length - 1].signal;
  });
  fetchMock.mockImplementation((url: string, init?: RequestInit) => {
    const page = Number(new URL(url).searchParams.get('page'));
    if (answers(page)) return respond({ total: 300, items: rows(100, `p${page}-`) });
    return new Promise((_, reject) => init?.signal?.addEventListener('abort', () => reject(new Error('timed out'))));
  });
  return { spy, over: () => controllers.forEach((controller) => controller.abort()) };
};
const pagesAsked = () => fetchMock.mock.calls.map(([url]) => Number(new URL(url).searchParams.get('page')));

beforeEach(() => {
  process.env.DIRECTORY_API_URL = 'https://api.test';
  fetchMock.mockReset();
  global.fetch = fetchMock as unknown as typeof fetch;
});
afterEach(() => {
  global.fetch = realFetch;
  jest.useRealTimers();
});

describe('toPastEventItem', () => {
  it('reads a row as the page’s event, in the event’s own time zone, with nothing about the viewer', () => {
    expect(toPastEventItem(row())).toEqual({
      uid: 'e1',
      name: 'DAI Summit',
      startDate: '2029-12-03T03:30:00.000Z',
      endDate: '2029-12-04T12:30:00.000Z',
      timezone: 'Asia/Kolkata',
      startDay: '2029-12-03',
      endDay: '2029-12-04',
      startTime: '9:00 AM',
      endTime: '6:00 PM',
      zone: 'UTC+5:30',
      city: 'Bangalore',
      cityKey: 'bangalore',
      place: 'Bangalore, India',
      mode: 'Hybrid',
      access: 'PAID',
      hosts: ['Protocol Labs', 'Filecoin Foundation'],
      focusAreas: [],
      tags: ['AI', 'Storage'],
      tagColor: null,
      picture: 'https://img/banner.png',
      goingCount: 12,
      faces: ['m1', 'm2', 'm3'].map((uid) => ({ uid, name: uid, image: null })),
    });
  });

  it('a bare row: UTC, no place, no host, and hidden attendance shows no count and no faces', () => {
    const bare = toPastEventItem(
      row({
        timezone: null,
        format: null,
        accessOption: null,
        tags: [],
        logo: null,
        banner: null,
        host: null,
        coHosts: [],
        gathering: null,
        goingCount: null,
      }),
    );
    expect(bare).toMatchObject({
      timezone: 'UTC',
      zone: 'UTC+0',
      startTime: '3:30 AM',
      city: null,
      place: null,
      mode: null,
      access: null,
      hosts: [],
      picture: null,
      goingCount: null,
      faces: [],
    });
  });

  it('an unknown time zone reads as UTC, and the "Others" gathering is no place', () => {
    const item = toPastEventItem(
      row({ timezone: 'Mars/Olympus', gathering: { uid: 'x', city: 'Others', country: null } }),
    );
    expect(item).toMatchObject({ timezone: 'UTC', city: null, cityKey: null, place: null });
  });

  it('keeps focus area codes out of the topics', () => {
    expect(toPastEventItem(row({ tags: ['Talks', 'FA3', 'fa1'] }))).toMatchObject({
      tags: ['Talks'],
      focusAreas: ['FA3', 'FA1'],
    });
  });

  it('an event that ends before it starts is a one-day event on its first day', () => {
    const item = toPastEventItem(
      row({ timezone: 'UTC', startDate: '2029-11-03T00:00:00.000Z', endDate: '2029-11-02T23:59:00.000Z' }),
    );
    expect(item).toMatchObject({ startDay: '2029-11-03', endDay: '2029-11-03' });
  });

  it.each([
    ['nothing', null],
    ['no object', 'e1'],
    ['no uid', row({ uid: '' })],
    ['no name', row({ name: null })],
    ['no start', row({ startDate: 'soon' })],
    ['no end', row({ endDate: null })],
  ])('drops a row with %s', (_name, bad) => {
    expect(toPastEventItem(bad)).toBeNull();
  });

  it('reads a row whose lists and objects are missing', () => {
    const { tags, host, coHosts, gathering, faces, ...rest } = row();
    expect(toPastEventItem({ ...rest, faces: [null, { name: 'No uid' }] })).toMatchObject({
      tags: [],
      hosts: [],
      faces: [],
    });
    void [tags, host, coHosts, gathering, faces];
  });
});

describe('getStartedEvents', () => {
  it('asks for every event from the epoch, with no clock in the address', async () => {
    jest.useFakeTimers({ now: NOW });
    serve([rows(1, 'a')], 1);
    await getStartedEvents();
    expect(fetchMock.mock.calls[0]).toEqual([
      'https://api.test/v1/irl/events?from=1970-01-01&page=1&limit=100',
      { cache: 'no-store', signal: expect.any(AbortSignal) },
    ]);
  });

  it('caches for five minutes under a key with no clock', () => {
    expect(cacheCall).toBeDefined();
    const [, key, options] = cacheCall as [unknown, string[], { revalidate: number; tags: string[] }];
    expect(key).toEqual(['past-events-page']);
    expect(options).toEqual({ revalidate: 300, tags: [ALL_EVENTS_CACHE_TAG] });
  });

  it('reads page 1, then the rest, at most 6 at a time', async () => {
    let open = 0;
    let most = 0;
    fetchMock.mockImplementation(async (url: string) => {
      const page = Number(new URL(url).searchParams.get('page'));
      open += 1;
      most = Math.max(most, open);
      await new Promise((resolve) => setTimeout(resolve, 1));
      open -= 1;
      return respond({ total: 950, items: rows(page === 10 ? 50 : 100, `p${page}-`) });
    });
    expect(await getStartedEvents(NOW)).toHaveLength(950);
    expect(pagesAsked()[0]).toBe(1);
    expect([...pagesAsked()].sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(most).toBe(6);
  });

  it('a failed page fails the load: no partial list', async () => {
    fetchMock.mockImplementation((url: string) =>
      url.includes('page=2') ? respond({}, 500) : respond({ total: 250, items: rows(100, 'a') }),
    );
    await expect(getStartedEvents(NOW)).rejects.toThrow('page 2 responded with 500');
  });

  it.each([
    ['no items', { total: 1 }],
    ['items that are no list', { total: 1, items: { e1: row() } }],
    ['no total', { items: [row()] }],
    ['a total that is no count', { items: [row()], total: '1' }],
    ['a total below the page it came with', { items: rows(3, 'a'), total: 2 }],
    ['nothing', null],
  ])('fails on a page with %s', async (_name, body) => {
    fetchMock.mockImplementation(() => respond(body));
    await expect(getStartedEvents(NOW)).rejects.toThrow('unexpected shape');
  });

  const fullPages = (total: number) =>
    fetchMock.mockImplementation((url: string) =>
      respond({ total, items: rows(100, `p${new URL(url).searchParams.get('page')}-`) }),
    );

  it('20 full pages are a list', async () => {
    fullPages(2000);
    expect(await getStartedEvents(NOW)).toHaveLength(2000);
    expect(fetchMock).toHaveBeenCalledTimes(PAST_EVENTS_MAX_PAGES);
  });

  it('one event more than 20 pages hold fails the load: the newest would be missing', async () => {
    fullPages(2001);
    await expect(getStartedEvents(NOW)).rejects.toThrow('longer than 20 pages');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('an empty page before the total is reached fails the load: no short list', async () => {
    serve([rows(100, 'a'), rows(20, 'b')], 250);
    await expect(getStartedEvents(NOW)).rejects.toThrow('page 3 is empty before its total of 250');
    serve([], 40);
    await expect(getStartedEvents(NOW)).rejects.toThrow('page 1 is empty');
  });

  it('no events at all is a list', async () => {
    serve([], 0);
    expect(await getStartedEvents(NOW)).toEqual([]);
  });

  it('requests that come while it loads share that load, and the next one loads again', async () => {
    const answers: (() => void)[] = [];
    fetchMock.mockImplementation(
      () =>
        new Promise((resolve) =>
          answers.push(() => resolve({ ok: true, json: async () => ({ total: 1, items: [row()] }) })),
        ),
    );
    const both = [getStartedEvents(NOW), getStartedEvents(NOW)];
    expect(fetchMock).toHaveBeenCalledTimes(1);
    answers.forEach((answer) => answer());
    expect((await Promise.all(both)).map((items) => items.length)).toEqual([1, 1]);

    serve([[row()]], 1);
    await getStartedEvents(NOW);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('a load that failed is not kept', async () => {
    fetchMock.mockImplementation(() => respond({}, 500));
    const both = [getStartedEvents(NOW), getStartedEvents(NOW)];
    expect((await Promise.allSettled(both)).map((r) => r.status)).toEqual(['rejected', 'rejected']);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    serve([[row()]], 1);
    expect(await getStartedEvents(NOW)).toHaveLength(1);
  });

  it('a call the backend never answers fails the load after 10 s, which is not kept', async () => {
    const error = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const timeout = hang();
    const both = [getStartedEvents(NOW), GET()] as const;
    expect(timeout.spy.mock.calls).toEqual([[10_000]]);
    timeout.over();
    await expect(both[0]).rejects.toThrow('timed out');
    const response = await both[1];
    expect(response.status).toBe(502);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(fetchMock).toHaveBeenCalledTimes(1);

    // The backend is well again.
    serve([[row()]], 1);
    expect(await getStartedEvents(NOW)).toHaveLength(1);
    timeout.spy.mockRestore();
    error.mockRestore();
  });

  it('each page has its own 10 s', async () => {
    const timeout = hang((page) => page < 3);
    const load = getStartedEvents(NOW);
    await new Promise((resolve) => setTimeout(resolve));
    expect(timeout.spy.mock.calls).toEqual([[10_000], [10_000], [10_000]]);
    timeout.over();
    await expect(load).rejects.toThrow('timed out');
    timeout.spy.mockRestore();
  });

  it('a malformed row is left out, the others stay', async () => {
    serve([[row({ uid: 'a' }), null, { uid: 'broken' }, row({ uid: 'b' })]], 4);
    expect((await getStartedEvents(NOW)).map((e) => e.uid)).toEqual(['a', 'b']);
  });

  it('an event on two pages counts once', async () => {
    serve(
      [
        [...rows(99, 'a'), row({ uid: 'twice' })],
        [row({ uid: 'twice' }), row({ uid: 'last' })],
      ],
      102,
    );
    const uids = (await getStartedEvents(NOW)).map((e) => e.uid);
    expect(uids).toHaveLength(101);
    expect(uids.filter((uid) => uid === 'twice')).toHaveLength(1);
  });

  it('has the events under way and those that start within a day, so a page can tell their end', async () => {
    const start = '2030-11-25T12:00:00.000Z';
    serve([[row({ uid: 'soon', startDate: start, endDate: '2030-11-25T13:00:00.000Z' })]], 1);
    const at = async (ms: number) => (await getStartedEvents(Date.parse(start) + ms)).map((e) => e.uid);
    const DAY = 86_400_000;
    expect(await at(-DAY - 1)).toEqual([]);
    expect(await at(-DAY)).toEqual(['soon']);
    expect(await at(60_000)).toEqual(['soon']);
    expect(await at(10 * DAY)).toEqual(['soon']);
  });

  it('has an event whose end is before its start from its end, however far off the start is', async () => {
    const end = Date.parse('2030-11-25T12:00:00.000Z');
    serve([[row({ startDate: '2031-06-01T09:00:00.000Z', endDate: new Date(end).toISOString() })]], 1);
    expect(await getStartedEvents(end - 1)).toEqual([]);
    expect(await getStartedEvents(end)).toHaveLength(1);
  });

  it('sorts newest first by first day, in each event’s own zone, then by start', async () => {
    const at = (uid: string, timezone: string, startDate: string) =>
      row({ uid, timezone, startDate, endDate: startDate.replace(/:\d\d:/, ':59:') });
    // Jan 2 in Tokyo, though it starts before the one that is still Jan 1 in New York.
    serve(
      [
        [
          at('new-york', 'America/New_York', '2030-01-02T01:00:00.000Z'),
          at('tokyo', 'Asia/Tokyo', '2030-01-01T15:30:00.000Z'),
        ],
      ],
      2,
    );
    expect((await getStartedEvents(NOW)).map((e) => [e.uid, e.startDay])).toEqual([
      ['tokyo', '2030-01-02'],
      ['new-york', '2030-01-01'],
    ]);
  });

  it('sorts newest first by first day, then by start', async () => {
    const on = (uid: string, startDate: string) =>
      row({ uid, timezone: 'UTC', startDate, endDate: startDate.replace(/T\d\d/, 'T23') });
    serve(
      [
        [
          on('old', '2028-01-05T09:00:00.000Z'),
          on('morning', '2029-12-31T08:00:00.000Z'),
          on('evening', '2029-12-31T19:00:00.000Z'),
          on('newest', '2030-01-01T09:00:00.000Z'),
        ],
      ],
      4,
    );
    expect((await getStartedEvents(NOW)).map((e) => e.uid)).toEqual(['newest', 'evening', 'morning', 'old']);
  });
});

describe('GET /api/events/past', () => {
  it('answers the events that have started, for the browser alone to keep for five minutes', async () => {
    jest.useFakeTimers({ now: NOW });
    serve(
      [
        [
          row({ uid: 'past' }),
          row({ uid: 'later', startDate: '2031-01-01T09:00:00Z', endDate: '2031-01-01T10:00:00Z' }),
        ],
      ],
      2,
    );
    const response = await GET();
    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe('private, max-age=300');
    const body = await response.json();
    expect(body.items.map((e: { uid: string }) => e.uid)).toEqual(['past']);
    expect(JSON.stringify(body)).not.toContain('isGoing');
  });

  it('answers 502 when the events fail to load, as on a backend without the endpoint', async () => {
    const error = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    fetchMock.mockImplementation(() => respond({ message: 'Not found' }, 404));
    const response = await GET();
    expect(response.status).toBe(502);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(await response.json()).not.toHaveProperty('items');
    error.mockRestore();
  });
});
