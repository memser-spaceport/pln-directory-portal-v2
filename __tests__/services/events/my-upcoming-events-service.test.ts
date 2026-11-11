import { getMyUpcomingEventUids, MY_UPCOMING_EVENTS_LIMIT } from '@/services/events/my-upcoming-events.service';
import { customFetch } from '@/utils/fetch-wrapper';

jest.mock('@/utils/fetch-wrapper', () => ({ customFetch: jest.fn() }));

const fetchMock = customFetch as jest.Mock;
const respond = (body: unknown, init: { ok?: boolean; status?: number } = {}) =>
  fetchMock.mockResolvedValue({ ok: init.ok ?? true, status: init.status ?? 200, json: async () => body });

describe('getMyUpcomingEventUids (LAB-3220)', () => {
  beforeEach(() => fetchMock.mockReset());

  it("asks for the member's upcoming group only, with the viewer's token", async () => {
    respond({ upcoming: { page: 1, limit: MY_UPCOMING_EVENTS_LIMIT, total: 0, items: [] } });

    await getMyUpcomingEventUids('m 1');

    const [url, options, withToken] = fetchMock.mock.calls[0];
    expect(url).toMatch(/\/v1\/members\/m%201\/events\?group=upcoming&limit=50$/);
    expect(options).toMatchObject({ method: 'GET', cache: 'no-store' });
    expect(withToken).toBe(true);
  });

  it('returns the event uids of the upcoming items', async () => {
    respond({
      upcoming: { page: 1, limit: 50, total: 3, items: [{ uid: 'e1' }, { uid: 'e2', showOnProfile: false }, {}] },
    });

    await expect(getMyUpcomingEventUids('m1')).resolves.toEqual(['e1', 'e2']);
  });

  it('returns nothing for a body without an upcoming group', async () => {
    respond({ past: { items: [{ uid: 'e0' }] } });

    await expect(getMyUpcomingEventUids('m1')).resolves.toEqual([]);
  });

  it('throws on a failed response, so the rail drops its marks', async () => {
    respond({}, { ok: false, status: 500 });

    await expect(getMyUpcomingEventUids('m1')).rejects.toThrow('500');
  });

  it('throws when customFetch gives no response (signed out mid-request)', async () => {
    fetchMock.mockResolvedValue(undefined);

    await expect(getMyUpcomingEventUids('m1')).rejects.toThrow('no response');
  });
});
