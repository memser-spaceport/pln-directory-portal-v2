import { NextRequest, NextResponse } from 'next/server';
import { plaaUpstreamUrl } from '../../_upstream';
import { isFeedbackBoardEnabled } from '@/components/page/aligement-assets/feedback/feedback.utils';

/**
 * Thin proxy for every `/api/v1/feedback/*` endpoint.
 *
 * One catch-all rather than fourteen near-identical files: the upstream owns
 * routing and every rule. This layer adds the Authorization header the browser
 * cannot send to PLAA_API_URL directly, and nothing else. It never inspects a
 * body, never decides who may see an item, and never calls Linear.
 *
 * Responses are passed through unchanged — including 404 for a private item
 * (AC-T4.1), 409, 422, and 429 with its Retry-After.
 */

/** Query params the upstream understands. Anything else is dropped. */
const FORWARDED_QUERY = ['type', 'status', 'sort', 'mine', 'cursor', 'limit', 'per_column'] as const;

/** Headers worth returning to the browser. Nothing from the upstream's internals. */
const PASSTHROUGH_RESPONSE_HEADERS = ['retry-after'];

export const dynamic = 'force-dynamic';

async function proxy(request: NextRequest, path: string[]): Promise<NextResponse> {
  // Behind the same flag as the pages (AC-T8.1): with the board off, this proxy
  // is as absent as the routes that call it, rather than a live write path into
  // the upstream that no UI admits to.
  if (!isFeedbackBoardEnabled()) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const authHeader = request.headers.get('authorization');
  if (!authHeader) {
    return NextResponse.json({ error: 'Authorization header is required' }, { status: 401 });
  }

  // PLAA_FEEDBACK_API_URL lets a developer run only the Feedback Board against
  // a local plaa-service while the rest of PLAA keeps reading a deployed one.
  // Unset everywhere else, where both resolve to the same upstream.
  const baseUrl = process.env.PLAA_FEEDBACK_API_URL || process.env.PLAA_API_URL;
  if (!baseUrl) {
    return NextResponse.json({ error: 'PLAA_API_URL is not configured' }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const query: Record<string, string | null> = {};
  for (const key of FORWARDED_QUERY) {
    query[key] = searchParams.get(key);
  }

  // plaaUpstreamUrl rejects any segment that isn't a plain id, which keeps a
  // crafted path from escaping /api/v1/feedback.
  const url = plaaUpstreamUrl(baseUrl, ['feedback', ...path], query);
  if (!url) {
    return NextResponse.json({ error: 'Invalid feedback path' }, { status: 400 });
  }

  try {
    const headers: Record<string, string> = { Authorization: authHeader };
    const contentType = request.headers.get('content-type');
    // The create route streams multipart through untouched: re-encoding it here
    // would break the boundary and lose the screenshots (AC-T4.4).
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
    // Viewer-specific: /me, has_voted, mine and triage differ per member, so
    // this must never land in a shared cache (AC-T4.3).
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
