import { upstreamError } from '@/app/api/plaa/_errors';
import { NextRequest, NextResponse } from 'next/server';
import { resolveAuthHeader } from '../_auth';
import { plaaUpstreamUrl } from '../../_upstream';

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

    const roundId = new URL(request.url).searchParams.get('round_id');
    const url = plaaUpstreamUrl(baseUrl, ['kudos', 'community-pool'], { round_id: roundId }) as string;

    const res = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', Authorization: authHeader },
    });

    if (!res.ok) {
      return upstreamError(res.status, res.headers?.get('retry-after'));
    }
    return NextResponse.json(await res.json());
  } catch (error) {
    console.error('PLAA kudos community-pool proxy error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
