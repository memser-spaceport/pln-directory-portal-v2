import { getTeamFocusAreaCounts } from '@/services/focus-areas/team-focus-area-counts.service';

/**
 * LAB-3162: the focus-area card's number is what its "Teams →" link lists, so it comes from the same
 * `GET /v1/teams-search` total the Teams page shows (360 for Digital Human Rights on the lab-3070 env, 2026-11-06).
 */
describe('getTeamFocusAreaCounts', () => {
  const realFetch = global.fetch;
  // jsdom has no AbortSignal.timeout; the service only passes it to fetch.
  beforeAll(() => {
    if (!('timeout' in AbortSignal)) {
      Object.defineProperty(AbortSignal, 'timeout', { value: () => new AbortController().signal, configurable: true });
    }
  });
  afterEach(() => {
    global.fetch = realFetch;
    jest.restoreAllMocks();
  });

  const TOTALS: Record<string, number> = { 'Digital Human Rights': 360, 'Economies & Governance': 104 };

  it('reads each title’s total from teams-search, one call each, filtered as the Teams link is', async () => {
    const fetchMock = jest.fn(async (url: string) => {
      const title = new URL(url, 'http://x').searchParams.get('focusAreas')!;
      return { ok: true, json: async () => ({ teams: [], total: TOTALS[title] }) };
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    await expect(getTeamFocusAreaCounts(Object.keys(TOTALS))).resolves.toEqual(TOTALS);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1][0]).toMatch(
      /\/v1\/teams-search\?page=1&limit=1&focusAreas=Economies%20%26%20Governance$/,
    );
  });

  it('returns null when any call fails or sends no total, so no card shows a number it can’t back up', async () => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});

    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ total: 360 }) })
      .mockResolvedValueOnce({ ok: false, status: 503 }) as unknown as typeof fetch;
    await expect(getTeamFocusAreaCounts(Object.keys(TOTALS))).resolves.toBeNull();

    global.fetch = jest
      .fn()
      .mockResolvedValue({ ok: true, json: async () => ({ error: 'x' }) }) as unknown as typeof fetch;
    await expect(getTeamFocusAreaCounts(['Neurotech'])).resolves.toBeNull();

    global.fetch = jest.fn().mockRejectedValue(new Error('down')) as unknown as typeof fetch;
    await expect(getTeamFocusAreaCounts(['Neurotech'])).resolves.toBeNull();
  });
});
