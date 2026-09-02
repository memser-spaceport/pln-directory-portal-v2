import { NextResponse } from 'next/server';
import { getCurrentRoundStats } from '@/services/plaa/rounds.service';

/** Intentionally public, no-auth — round stats aren't user-specific. */
export async function GET() {
  const { data, error } = await getCurrentRoundStats();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? 'Failed to fetch round stats' }, { status: 502 });
  }

  return NextResponse.json(data);
}
