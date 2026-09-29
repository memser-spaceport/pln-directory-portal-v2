import { plaaApiHeaders } from '@/services/plaa/plaa-api';
import { getCurrentRoundStats, getRoundStats } from '@/services/plaa/rounds.service';
import { getTrustHoldings } from '@/services/plaa/trust-holdings.service';
import { GET as getSnapshotStatus } from '@/app/api/plaa/snapshot-status/route';

jest.mock('next/server', () => ({
  NextResponse: { json: (body: unknown, init?: { status?: number }) => ({ body, status: init?.status ?? 200 }) },
}));

const sentHeaders = (fetchMock: jest.Mock) =>
  (fetchMock.mock.calls[0][1] as { headers: Record<string, string> }).headers;

describe('PLAA API key header', () => {
  const env = { ...process.env };
  const fetchMock = jest.fn();

  beforeEach(() => {
    process.env.PLAA_API_URL = 'https://plaa.example';
    process.env.PLAA_API_KEY = 'plaa_test-key';
    global.fetch = fetchMock as unknown as typeof fetch;
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({}) });
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    process.env = { ...env };
    jest.restoreAllMocks();
    fetchMock.mockReset();
  });

  it('adds x-api-key when PLAA_API_KEY is set', () => {
    expect(plaaApiHeaders()).toEqual({ 'Content-Type': 'application/json', 'x-api-key': 'plaa_test-key' });
  });

  it('sends no x-api-key header when PLAA_API_KEY is unset', () => {
    delete process.env.PLAA_API_KEY;
    expect(plaaApiHeaders()).toEqual({ 'Content-Type': 'application/json' });
  });

  it.each([
    ['current round stats', () => getCurrentRoundStats()],
    ['round stats', () => getRoundStats(3)],
    ['trust holdings', () => getTrustHoldings()],
    ['snapshot status', () => getSnapshotStatus()],
  ])('sends the key when fetching %s', async (_, call) => {
    await call();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(sentHeaders(fetchMock)['x-api-key']).toBe('plaa_test-key');
  });
});
