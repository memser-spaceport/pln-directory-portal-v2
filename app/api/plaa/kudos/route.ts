import { NextRequest, NextResponse } from 'next/server';
import { resolveAuthHeader } from './_auth';
import { plaaUpstreamUrl } from '../_upstream';

export async function GET(request: NextRequest) {
  try {
    const authHeader = resolveAuthHeader(request);
    if (!authHeader) {
      return NextResponse.json({ error: 'Authorization header is required' }, { status: 401 });
    }

    const baseUrl = process.env.PLAA_API_URL;
    if (!baseUrl) {
      return NextResponse.json({ error: 'PLAA_API_URL is not configured' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const url = plaaUpstreamUrl(baseUrl, ['kudos'], {
      limit: searchParams.get('limit'),
      cursor: searchParams.get('cursor'),
      page: searchParams.get('page'),
    }) as string;

    const res = await fetch(url, {
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
