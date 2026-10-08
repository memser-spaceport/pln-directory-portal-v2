import { NextResponse } from 'next/server';
import { plaaApiHeaders } from '@/services/plaa/plaa-api';

/** Intentionally public, no-auth: served from the public summary. */
export async function GET() {
  try {
    const res = await fetch(`${process.env.PLAA_API_URL}/api/v1/summary`, {
      method: 'GET',
      headers: plaaApiHeaders(),
      cache: 'no-store',
    });

    if (!res.ok) {
      return NextResponse.json({ error: `PLAA API request failed: ${res.status}` }, { status: 502 });
    }

    const { round } = await res.json();
    return NextResponse.json(round);
  } catch (error) {
    console.error('PLAA round-stats proxy error:', error);
    return NextResponse.json({ error: 'Failed to fetch round stats' }, { status: 502 });
  }
}
