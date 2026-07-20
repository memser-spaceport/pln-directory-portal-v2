import { NextRequest, NextResponse } from 'next/server';

/** Recipient picker: active members the caller may give kudos to (caller excluded). */
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

    const res = await fetch(`${baseUrl}/api/v1/kudos/recipients`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', Authorization: authHeader },
    });

    if (!res.ok) {
      return NextResponse.json({ error: `PLAA API request failed: ${res.status}` }, { status: res.status });
    }
    return NextResponse.json(await res.json());
  } catch (error) {
    console.error('PLAA kudos recipients proxy error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
