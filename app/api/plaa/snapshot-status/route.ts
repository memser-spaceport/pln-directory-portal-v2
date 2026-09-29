import { NextRequest, NextResponse } from 'next/server';
import { plaaApiHeaders } from '@/services/plaa/plaa-api';

export async function GET(request: NextRequest) {
  const [type, token] = request.headers.get('authorization')?.split(' ') ?? [];
  if (type !== 'Bearer' || !token) {
    return NextResponse.json({ error: 'Authorization header is required' }, { status: 401 });
  }

  const baseUrl = process.env.PLAA_API_URL;
  if (!baseUrl) {
    return NextResponse.json({ error: 'PLAA_API_URL is not configured' }, { status: 500 });
  }

  try {
    const res = await fetch(`${baseUrl}/api/v1/rounds/snapshot-status`, {
      method: 'GET',
      headers: plaaApiHeaders(token),
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
