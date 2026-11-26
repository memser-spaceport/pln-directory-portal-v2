import { upstreamError } from '@/app/api/plaa/_errors';
import { NextRequest, NextResponse } from 'next/server';
import { resolveAuthHeader } from '../_auth';

export async function GET(request: NextRequest) {
  try {
    const authHeader = resolveAuthHeader(request);
    if (!authHeader) {
      return NextResponse.json({ error: 'Authorization header is required' }, { status: 401 });
    }

    const baseUrl = process.env.PLAA_API_URL;
    if (!baseUrl) {
      return NextResponse.json({ error: 'PLAA service is temporarily unavailable' }, { status: 500 });
    }

    const res = await fetch(`${baseUrl}/api/v1/kudos/recipients`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', Authorization: authHeader },
    });

    if (!res.ok) {
      return upstreamError(res.status, res.headers?.get('retry-after'));
    }
    return NextResponse.json(await res.json());
  } catch (error) {
    console.error('PLAA kudos recipients proxy error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
