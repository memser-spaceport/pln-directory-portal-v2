import { upstreamError } from '@/app/api/plaa/_errors';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Authorization header is required' }, { status: 401 });
    }

    const baseUrl = process.env.PLAA_API_URL;
    if (!baseUrl) {
      return NextResponse.json({ error: 'PLAA service is temporarily unavailable' }, { status: 500 });
    }

    const res = await fetch(`${baseUrl}/api/v1/profile-balance/history/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
    });

    if (!res.ok) {
      return upstreamError(res.status, res.headers?.get('retry-after'));
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('PLAA profile-history proxy error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
