import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const roundNumber = searchParams.get('roundNumber');
    const leaderboardType = searchParams.get('leaderboardType');

    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Authorization header is required' }, { status: 401 });
    }

    if (!roundNumber) {
      return NextResponse.json({ error: 'roundNumber is required' }, { status: 400 });
    }

    const baseUrl = process.env.PLAA_API_URL;
    if (!baseUrl) {
      return NextResponse.json({ error: 'PLAA_API_URL is not configured' }, { status: 500 });
    }

    const url = new URL(`${baseUrl}/api/v1/leaderboard`);
    url.searchParams.set('roundNumber', roundNumber);
    if (leaderboardType) url.searchParams.set('leaderboardType', leaderboardType);

    const res = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      cache: 'no-store',
    });

    if (res.status === 403 || res.status === 404) {
      return NextResponse.json(null, { status: res.status });
    }

    if (!res.ok) {
      return NextResponse.json(
        { error: `PLAA API request failed: ${res.status}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('PLAA leaderboard proxy error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
