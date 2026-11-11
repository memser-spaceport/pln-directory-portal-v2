import { NextRequest, NextResponse } from 'next/server';
import { plaaUpstreamUrl } from '../../_upstream';
import { isFeedbackBoardEnabled } from '@/components/page/aligement-assets/feedback/feedback.utils';

const FORWARDED_QUERY = ['type', 'status', 'sort', 'mine', 'cursor', 'limit', 'per_column'] as const;

const PASSTHROUGH_RESPONSE_HEADERS = ['retry-after'];

export const dynamic = 'force-dynamic';

async function proxy(request: NextRequest, path: string[]): Promise<NextResponse> {
  if (!isFeedbackBoardEnabled()) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const authHeader = request.headers.get('authorization');
  if (!authHeader) {
    return NextResponse.json({ error: 'Authorization header is required' }, { status: 401 });
  }

  const baseUrl = process.env.PLAA_FEEDBACK_API_URL || process.env.PLAA_API_URL;
  if (!baseUrl) {
    return NextResponse.json({ error: 'PLAA_API_URL is not configured' }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const query: Record<string, string | null> = {};
  for (const key of FORWARDED_QUERY) {
    query[key] = searchParams.get(key);
  }

  const url = plaaUpstreamUrl(baseUrl, ['feedback', ...path], query);
  if (!url) {
    return NextResponse.json({ error: 'Invalid feedback path' }, { status: 400 });
  }

  try {
    const headers: Record<string, string> = { Authorization: authHeader };
    const contentType = request.headers.get('content-type');
    // Forward multipart as raw bytes: re-encoding it would break the boundary.
    if (contentType) headers['Content-Type'] = contentType;

    const method = request.method;
    const hasBody = method !== 'GET' && method !== 'HEAD' && method !== 'DELETE';

    const upstream = await fetch(url, {
      method,
      headers,
      ...(hasBody ? { body: Buffer.from(await request.arrayBuffer()) } : {}),
      cache: 'no-store',
    });

    const response =
      upstream.status === 204
        ? new NextResponse(null, { status: 204 })
        : NextResponse.json(await readJson(upstream), { status: upstream.status });

    for (const header of PASSTHROUGH_RESPONSE_HEADERS) {
      const value = upstream.headers.get(header);
      if (value) response.headers.set(header, value);
    }
    response.headers.set('Cache-Control', 'private, no-store');
    return response;
  } catch (error) {
    console.error('PLAA feedback proxy error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { error: 'Upstream returned a non-JSON response' };
  }
}

type RouteContext = { params: Promise<{ path: string[] }> };

export async function GET(request: NextRequest, context: RouteContext) {
  return proxy(request, (await context.params).path);
}

export async function POST(request: NextRequest, context: RouteContext) {
  return proxy(request, (await context.params).path);
}

export async function PUT(request: NextRequest, context: RouteContext) {
  return proxy(request, (await context.params).path);
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  return proxy(request, (await context.params).path);
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  return proxy(request, (await context.params).path);
}
