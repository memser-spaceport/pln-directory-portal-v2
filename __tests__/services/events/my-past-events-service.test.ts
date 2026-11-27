import { MY_PAST_EVENTS_MAX_PAGES, getMyPastEventUids } from '@/services/events/my-past-events.service';
import { customFetch } from '@/utils/fetch-wrapper';

jest.mock('@/utils/fetch-wrapper', () => ({ customFetch: jest.fn() }));

/* LAB-3418: the uids behind the "Went" pills. */

const fetchMock = customFetch as jest.Mock;
const page = (from: number, count: number, total: number) => ({
  past: {
    page: 1,
    limit: 50,
    total,
    items: Array.from({ length: count }, (_, i) => ({ kind: 'event', uid: `e${from + i}` })),
  },
});
const respond = (...bodies: unknown[]) =>
  bodies.forEach((body) => fetchMock.mockResolvedValueOnce({ ok: true, status: 200, json: async () => body }));

beforeEach(() => fetchMock.mockReset());

it("asks for the member's past group, 50 a call, with the viewer's token", async () => {
  respond(page(0, 2, 2));
  expect(await getMyPastEventUids('m 1')).toEqual(['e0', 'e1']);
  expect(fetchMock).toHaveBeenCalledTimes(1);
  const [url, options, withToken] = fetchMock.mock.calls[0];
  expect(url).toMatch(/\/v1\/members\/m%201\/events\?group=past&page=1&limit=50$/);
  expect(options).toMatchObject({ method: 'GET', cache: 'no-store' });
  expect(withToken).toBe(true);
});

it('pages through all of them', async () => {
  respond(page(0, 50, 120), page(50, 50, 120), page(100, 20, 120));
  expect(await getMyPastEventUids('m1')).toHaveLength(120);
  expect(fetchMock.mock.calls.map(([url]) => /page=(\d+)/.exec(url)?.[1])).toEqual(['1', '2', '3']);
});

it('stops at exactly one full page, at an empty page, and at the cap', async () => {
  respond(page(0, 50, 50));
  expect(await getMyPastEventUids('m1')).toHaveLength(50);
  expect(fetchMock).toHaveBeenCalledTimes(1);

  fetchMock.mockReset();
  respond(page(0, 50, 1_000_000), page(0, 0, 1_000_000));
  expect(await getMyPastEventUids('m1')).toHaveLength(50);
  expect(fetchMock).toHaveBeenCalledTimes(2);

  fetchMock.mockReset();
  fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => page(0, 50, 1_000_000) });
  await getMyPastEventUids('m1');
  expect(fetchMock).toHaveBeenCalledTimes(MY_PAST_EVENTS_MAX_PAGES);
});

it('leaves out an item without a uid, and counts an event once', async () => {
  respond({ past: { total: 4, items: [{ uid: 'a' }, {}, null, { uid: 'a' }] } });
  expect(await getMyPastEventUids('m1')).toEqual(['a']);
});

it('throws on a failed page, on no response and on an unexpected body', async () => {
  respond(page(0, 50, 80));
  fetchMock.mockResolvedValueOnce({ ok: false, status: 500 });
  await expect(getMyPastEventUids('m1')).rejects.toThrow('500');
  fetchMock.mockResolvedValueOnce(undefined);
  await expect(getMyPastEventUids('m1')).rejects.toThrow('no response');
  respond({ upcoming: { items: [] } });
  await expect(getMyPastEventUids('m1')).rejects.toThrow('unexpected shape');
});
