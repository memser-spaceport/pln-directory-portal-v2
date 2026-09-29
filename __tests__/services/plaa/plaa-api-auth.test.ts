import { plaaApiHeaders } from '@/services/plaa/plaa-api';
import { getCompletedBuybacks, getCurrentRoundStats, getRoundStats } from '@/services/plaa/rounds.service';
import { getTrustHoldings } from '@/services/plaa/trust-holdings.service';
import { getPlaaSummary } from '@/services/plaa/summary.service';
import { GET as getSnapshotStatus } from '@/app/api/plaa/snapshot-status/route';
import { GET as getRoundStatsRoute } from '@/app/api/plaa/round-stats/route';

jest.mock('next/server', () => ({
  NextResponse: { json: (body: unknown, init?: { status?: number }) => ({ body, status: init?.status ?? 200 }) },
}));

const headersOf = (fetchMock: jest.Mock, call = 0) =>
  (fetchMock.mock.calls[call][1] as { headers: Record<string, string> }).headers;

const summary = {
  round: {
    roundNumber: 20,
    period: '2026-09-01',
    month: 'September',
    year: 2026,
    onboardedParticipants: 66,
    chart: [],
  },
  trust: null,
};

describe('PLAA API auth', () => {
  const env = { ...process.env };
  const fetchMock = jest.fn();

  beforeEach(() => {
    process.env.PLAA_API_URL = 'https://plaa.example';
    global.fetch = fetchMock as unknown as typeof fetch;
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({}) });
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    process.env = { ...env };
    jest.restoreAllMocks();
    fetchMock.mockReset();
  });

  it('sends the member session as a bearer token', () => {
    expect(plaaApiHeaders('member-token')).toEqual({
      'Content-Type': 'application/json',
      Authorization: 'Bearer member-token',
    });
  });

  it('sends no credentials without a session, even when PLAA_API_KEY is set', () => {
    process.env.PLAA_API_KEY = 'plaa_should-not-be-sent';
    expect(plaaApiHeaders()).toEqual({ 'Content-Type': 'application/json' });
  });

  it.each([
    ['current round stats', () => getCurrentRoundStats('member-token')],
    ['round stats', () => getRoundStats(3, 'member-token')],
    ['trust holdings', () => getTrustHoldings('member-token')],
  ])('forwards the session when fetching %s', async (_, call) => {
    await call();
    expect(headersOf(fetchMock).Authorization).toBe('Bearer member-token');
  });

  it('forwards the session on every round fetched for completed buybacks', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ roundNumber: 2, buyback: null }) });
    await getCompletedBuybacks('member-token');
    expect(fetchMock).toHaveBeenCalledTimes(3);
    fetchMock.mock.calls.forEach((_, i) => expect(headersOf(fetchMock, i).Authorization).toBe('Bearer member-token'));
  });

  it('fetches the public summary without credentials', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => summary });
    const { data } = await getPlaaSummary();
    expect(fetchMock.mock.calls[0][0]).toBe('https://plaa.example/api/v1/summary');
    expect(headersOf(fetchMock).Authorization).toBeUndefined();
    expect(data).toEqual(summary);
  });

  it('serves the navbar round figures from the public summary', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => summary });
    const response = (await getRoundStatsRoute()) as unknown as { body: unknown; status: number };
    expect(fetchMock.mock.calls[0][0]).toBe('https://plaa.example/api/v1/summary');
    expect(response).toEqual({ body: summary.round, status: 200 });
  });

  it('forwards the caller session from the snapshot-status proxy', async () => {
    const request = { headers: new Headers({ authorization: 'Bearer member-token' }) };
    await getSnapshotStatus(request as never);
    expect(headersOf(fetchMock).Authorization).toBe('Bearer member-token');
  });

  it('rejects snapshot-status without a session instead of calling the API', async () => {
    const response = (await getSnapshotStatus({ headers: new Headers() } as never)) as unknown as { status: number };
    expect(response.status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
