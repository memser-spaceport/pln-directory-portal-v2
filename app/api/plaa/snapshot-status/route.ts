import { NextResponse } from 'next/server';

/** Intentionally public, no-auth — a round's lifecycle state isn't user-specific. */
export async function GET() {
  const baseUrl = process.env.PLAA_API_URL;
  if (!baseUrl) {
    return NextResponse.json({ error: 'PLAA_API_URL is not configured' }, { status: 500 });
  }

  try {
    const res = await fetch(`${baseUrl}/api/v1/rounds/snapshot-status`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
    });

    if (!res.ok) {
      return NextResponse.json({ error: `PLAA API request failed: ${res.status}` }, { status: res.status });
    }

    return NextResponse.json(await res.json());
  } catch (error) {
    console.error('PLAA snapshot-status proxy error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
