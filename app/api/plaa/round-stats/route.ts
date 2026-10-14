import { NextResponse } from 'next/server';
import { getPlaaSummary } from '@/services/plaa/summary.service';

/** Intentionally public, no-auth: served from the public summary. */
export async function GET() {
  const { data, error } = await getPlaaSummary();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? 'Failed to fetch round stats' }, { status: 502 });
  }

  return NextResponse.json(data.round);
}
