import { getUpcomingEvents } from '@/services/events/events.service';

const row = {
  uid: 'e1',
  name: 'libp2p Day',
  websiteUrl: '',
  logo: null,
  location: 'Lisbon',
  flag: null,
  startDate: '2026-11-05T09:00:00.000Z',
  endDate: '2026-11-05T18:00:00.000Z',
};

const respond = (body: unknown, init: { ok?: boolean; status?: number; total?: string } = {}) =>
  jest.fn().mockResolvedValue({
    ok: init.ok ?? true,
    status: init.status ?? 200,
    headers: new Headers(init.total === undefined ? {} : { 'X-Total-Count': init.total }),
    json: async () => body,
  });

describe('getUpcomingEvents', () => {
  const originalFetch = global.fetch;
  const originalTimeout = AbortSignal.timeout;
  beforeAll(() => {
    // jsdom has no AbortSignal.timeout.
    AbortSignal.timeout = jest.fn(() => new AbortController().signal);
  });
  afterAll(() => {
    AbortSignal.timeout = originalTimeout;
  });
  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('asks for the next 30 days, three, soonest first', async () => {
    const fetchMock = respond([row], { total: '7' });
    global.fetch = fetchMock;

    await getUpcomingEvents({ days: 30, limit: 3 });

    expect(fetchMock.mock.calls[0][0]).toMatch(/\/v1\/irl\/events\/upcoming\?days=30&limit=3&sort=soonest$/);
  });

  it('reads the total from X-Total-Count', async () => {
    global.fetch = respond([row], { total: '7' });

    await expect(getUpcomingEvents({ days: 30, limit: 3 })).resolves.toEqual({
      events: [
        {
          uid: 'e1',
          name: 'libp2p Day',
          startDate: row.startDate,
          endDate: row.endDate,
          location: 'Lisbon',
          calendarId: null,
        },
      ],
      total: 7,
    });
  });

  it("keeps the event's pln-events id (externalId) for the calendar link", async () => {
    global.fetch = respond([{ ...row, externalId: 'JdkJYigZLBTL' }]);

    const { events } = await getUpcomingEvents({ days: 30, limit: 3 });

    expect(events[0].calendarId).toBe('JdkJYigZLBTL');
  });

  it('falls back to the array length without the header', async () => {
    global.fetch = respond([row, { ...row, uid: 'e2' }]);

    await expect(getUpcomingEvents({ days: 30, limit: 3 })).resolves.toMatchObject({ total: 2 });
  });

  it('throws on a failed response, so the caller drops the section', async () => {
    global.fetch = respond({}, { ok: false, status: 500 });

    await expect(getUpcomingEvents({ days: 30, limit: 3 })).rejects.toThrow('500');
  });
});
