import { upstreamError } from '@/app/api/plaa/_errors';
import { NextResponse } from 'next/server';
import { getPlaaSummary } from '@/services/plaa/summary.service';

/** Intentionally public, no-auth: served from the public summary. */
export async function GET() {
  const { data, error } = await getPlaaSummary();

  if (error || !data) {
    return upstreamError();
  }

  return NextResponse.json(data.round);
}
