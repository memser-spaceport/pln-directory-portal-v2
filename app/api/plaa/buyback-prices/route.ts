import { NextRequest, NextResponse } from 'next/server';
import { getAllRoundStats } from '@/services/plaa/rounds.service';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) {
    return NextResponse.json({ error: 'Authorization header is required' }, { status: 401 });
  }

  const { data, error } = await getAllRoundStats(authHeader.replace(/^Bearer\s+/i, ''));

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? 'Failed to fetch buyback prices' }, { status: 502 });
  }

  const prices = data.flatMap(({ roundNumber, buyback }) =>
    buyback && !buyback.simulation && buyback.clearingPrice !== null
      ? [{ roundNumber, auctionNumber: buyback.auctionNumber, clearingPrice: buyback.clearingPrice }]
      : [],
  );

  return NextResponse.json(prices);
}
