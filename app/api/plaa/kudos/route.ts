import { NextRequest, NextResponse } from 'next/server';

/** Shared kudos board (feed). Proxies to plaa-service, forwarding the session. */
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

    const { searchParams } = new URL(request.url);
    const qs = new URLSearchParams();
    const limit = searchParams.get('limit');
    const cursor = searchParams.get('cursor');
    if (limit) qs.set('limit', limit);
    if (cursor) qs.set('cursor', cursor);
    const query = qs.toString();

    const res = await fetch(`${baseUrl}/api/v1/kudos${query ? `?${query}` : ''}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', Authorization: authHeader },
    });

    if (!res.ok) {
      return NextResponse.json({ error: `PLAA API request failed: ${res.status}` }, { status: res.status });
    }
    return NextResponse.json(await res.json());
  } catch (error) {
    console.error('PLAA kudos feed proxy error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
