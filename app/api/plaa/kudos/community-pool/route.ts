import { NextRequest, NextResponse } from 'next/server';

/** The caller's community pool for the current round (server-scoped). */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Authorization header is required' }, { status: 401 });
    }

    const baseUrl = process.env.PLAA_API_URL;
    if (!baseUrl) {
      return NextResponse.json({ error: 'PLAA_API_URL is not configured' }, { status: 500 });
    }

    const roundId = new URL(request.url).searchParams.get('round_id');
    const query = roundId ? `?round_id=${encodeURIComponent(roundId)}` : '';

    const res = await fetch(`${baseUrl}/api/v1/kudos/community-pool${query}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', Authorization: authHeader },
    });

    if (!res.ok) {
      return NextResponse.json({ error: `PLAA API request failed: ${res.status}` }, { status: res.status });
    }
    return NextResponse.json(await res.json());
  } catch (error) {
    console.error('PLAA kudos community-pool proxy error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
