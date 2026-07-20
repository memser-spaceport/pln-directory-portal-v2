import { NextRequest, NextResponse } from 'next/server';

/** Give a community kudos. The giver is resolved server-side from the session. */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Authorization header is required' }, { status: 401 });
    }

    const baseUrl = process.env.PLAA_API_URL;
    if (!baseUrl) {
      return NextResponse.json({ error: 'PLAA_API_URL is not configured' }, { status: 500 });
    }

    const body = await request.text();

    const res = await fetch(`${baseUrl}/api/v1/kudos/community`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: authHeader },
      body,
    });

    const data = await res.json().catch(() => null);
    // Forward the status so the client can distinguish 400 / 403 / 409.
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error('PLAA kudos submit proxy error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
