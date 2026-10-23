/** @jest-environment node */
import { NextRequest } from 'next/server';

const mockGetAllRoundStats = jest.fn();
jest.mock('@/services/plaa/rounds.service', () => ({
  getAllRoundStats: (token?: string) => mockGetAllRoundStats(token),
}));

import { GET } from '@/app/api/plaa/buyback-prices/route';

function request(headers: Record<string, string> = {}) {
  return new NextRequest('http://localhost/api/plaa/buyback-prices', { headers });
}

function round(overrides: Record<string, unknown> = {}) {
  return {
    roundNumber: 12,
    buyback: { auctionNumber: 7, clearingPrice: 1.48, simulation: false, ...(overrides.buyback as object) },
    ...overrides,
  };
}

describe('GET /api/plaa/buyback-prices', () => {
  beforeEach(() => jest.clearAllMocks());

  it('refuses an unauthenticated request rather than calling upstream', async () => {
    const res = await GET(request());

    expect(res.status).toBe(401);
    expect(mockGetAllRoundStats).not.toHaveBeenCalled();
  });

  it('passes the bearer token through, without the scheme', async () => {
    mockGetAllRoundStats.mockResolvedValue({ data: [] });
    await GET(request({ authorization: 'Bearer abc123' }));

    expect(mockGetAllRoundStats).toHaveBeenCalledWith('abc123');
  });

  it('returns only round, auction, and price — not the per-bidder bids', async () => {
    mockGetAllRoundStats.mockResolvedValue({
      data: [round({ buyback: { auctionNumber: 7, clearingPrice: 1.48, simulation: false, bids: [{ bidderId: 'm1' }] } })],
    });

    const body = await (await GET(request({ authorization: 'Bearer t' }))).json();

    expect(body).toEqual([{ roundNumber: 12, auctionNumber: 7, clearingPrice: 1.48 }]);
  });

  it('drops simulations, which never priced a real redemption', async () => {
    mockGetAllRoundStats.mockResolvedValue({
      data: [round({ buyback: { auctionNumber: 7, clearingPrice: 9.99, simulation: true } })],
    });

    expect(await (await GET(request({ authorization: 'Bearer t' }))).json()).toEqual([]);
  });

  it('drops rounds with no price and rounds with no buyback at all', async () => {
    mockGetAllRoundStats.mockResolvedValue({
      data: [
        round({ buyback: { auctionNumber: 7, clearingPrice: null, simulation: false } }),
        { roundNumber: 13, buyback: null },
        round({ roundNumber: 14 }),
      ],
    });

    expect(await (await GET(request({ authorization: 'Bearer t' }))).json()).toEqual([
      { roundNumber: 14, auctionNumber: 7, clearingPrice: 1.48 },
    ]);
  });

  it('reports upstream failure as 502 rather than an empty price list', async () => {
    mockGetAllRoundStats.mockResolvedValue({ error: { message: 'upstream exploded' } });

    const res = await GET(request({ authorization: 'Bearer t' }));

    expect(res.status).toBe(502);
    expect((await res.json()).error).toBe('upstream exploded');
  });
});
