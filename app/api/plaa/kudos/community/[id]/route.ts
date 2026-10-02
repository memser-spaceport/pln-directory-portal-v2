import { NextRequest, NextResponse } from 'next/server';
import { resolveAuthHeader } from '../../_auth';

const KUDOS_ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const authHeader = resolveAuthHeader(request);
    if (!authHeader) {
      return NextResponse.json({ error: 'Authorization header is required' }, { status: 401 });
    }

    const baseUrl = process.env.PLAA_API_URL;
    if (!baseUrl) {
      return NextResponse.json({ error: 'PLAA_API_URL is not configured' }, { status: 500 });
    }

    const { id } = await context.params;
    if (!KUDOS_ID_PATTERN.test(id)) {
      return NextResponse.json({ error: 'Invalid kudos id' }, { status: 400 });
    }
    const body = await request.text();

    const res = await fetch(`${baseUrl}/api/v1/kudos/community/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: authHeader },
      body,
    });

    const data = await res.json().catch(() => null);
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error('PLAA kudos update proxy error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
