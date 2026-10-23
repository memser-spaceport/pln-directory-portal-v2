import { NextRequest, NextResponse } from 'next/server';
import { getAllRoundStats } from '@/services/plaa/rounds.service';

/**
 * Clearing price per auction, for pricing a member's redemptions.
 *
 * Goes through a proxy because PLAA_API_URL is server-only, and carries just
 * the three fields the profile needs rather than every round's full stats,
 * which include per-bidder bids this caller has no business receiving.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) {
    return NextResponse.json({ error: 'Authorization header is required' }, { status: 401 });
  }

  const { data, error } = await getAllRoundStats(authHeader.replace(/^Bearer\s+/i, ''));

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? 'Failed to fetch buyback prices' }, { status: 502 });
  }

  const prices = data
    .filter((round) => round.buyback && !round.buyback.simulation && round.buyback.clearingPrice !== null)
    .map((round) => ({
      roundNumber: round.roundNumber,
      auctionNumber: round.buyback!.auctionNumber,
      clearingPrice: round.buyback!.clearingPrice as number,
    }));

  return NextResponse.json(prices);
}
