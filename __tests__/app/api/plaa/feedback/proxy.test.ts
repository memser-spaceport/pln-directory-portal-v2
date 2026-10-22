/**
 * @jest-environment node
 *
 * Route handlers run on the server: jsdom has no Request/Response.
 */
import { NextRequest } from 'next/server';
import { DELETE, GET, POST, PUT } from '@/app/api/plaa/feedback/[...path]/route';

const UPSTREAM = 'https://plaa.test';

function makeRequest(url: string, init: RequestInit = {}) {
  return new NextRequest(new Request(url, init));
}

function context(path: string[]) {
  return { params: Promise.resolve({ path }) };
}

const AUTH = { authorization: 'Bearer member-token' };

beforeEach(() => {
  process.env.PLAA_API_URL = UPSTREAM;
  delete process.env.PLAA_FEEDBACK_API_URL;
  global.fetch = jest.fn();
});

afterEach(() => jest.resetAllMocks());

function upstreamReplies(body: unknown, init: { status?: number; headers?: Record<string, string> } = {}) {
  (global.fetch as jest.Mock).mockResolvedValue(
    new Response(body === null ? null : JSON.stringify(body), {
      status: init.status ?? 200,
      headers: init.headers,
    }),
  );
}

function fetchCall() {
  return (global.fetch as jest.Mock).mock.calls[0];
}

describe('auth and configuration', () => {
  it('401s without an Authorization header, before calling upstream', async () => {
    const response = await GET(makeRequest(`http://portal/api/plaa/feedback/items`), context(['items']));
    expect(response.status).toBe(401);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('prefers PLAA_FEEDBACK_API_URL so only this board can be pointed elsewhere', async () => {
    process.env.PLAA_FEEDBACK_API_URL = 'http://localhost:3000';
    upstreamReplies({ items: [] });

    await GET(makeRequest('http://portal/api/plaa/feedback/items', { headers: AUTH }), context(['items']));
    expect(fetchCall()[0]).toBe('http://localhost:3000/api/v1/feedback/items');
  });

  it('falls back to PLAA_API_URL when the feedback override is unset', async () => {
    upstreamReplies({ items: [] });

    await GET(makeRequest('http://portal/api/plaa/feedback/items', { headers: AUTH }), context(['items']));
    expect(fetchCall()[0]).toBe(`${UPSTREAM}/api/v1/feedback/items`);
  });

  it('500s when neither upstream is configured', async () => {
    delete process.env.PLAA_API_URL;
    const response = await GET(
      makeRequest('http://portal/api/plaa/feedback/items', { headers: AUTH }),
      context(['items']),
    );
    expect(response.status).toBe(500);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('forwards the caller’s token and never a server secret', async () => {
    upstreamReplies({ items: [] });
    await GET(makeRequest('http://portal/api/plaa/feedback/items', { headers: AUTH }), context(['items']));

    const [, init] = fetchCall();
    expect(init.headers.Authorization).toBe('Bearer member-token');
  });
});

describe('AC-T4.1 responses pass through unchanged', () => {
  it('returns 404 for a private item', async () => {
    upstreamReplies({ error: 'Feedback item not found' }, { status: 404 });
    const response = await GET(
      makeRequest('http://portal/api/plaa/feedback/items/abc', { headers: AUTH }),
      context(['items', 'abc']),
    );
    expect(response.status).toBe(404);
  });

  it.each([403, 409, 422, 500])('passes %i through', async (status) => {
    upstreamReplies({ error: 'nope' }, { status });
    const response = await PUT(
      makeRequest('http://portal/api/plaa/feedback/items/abc/vote', { method: 'PUT', headers: AUTH }),
      context(['items', 'abc', 'vote']),
    );
    expect(response.status).toBe(status);
  });

  it('keeps Retry-After on a 429 so the UI can say when to come back', async () => {
    upstreamReplies({ error: 'limit' }, { status: 429, headers: { 'Retry-After': '3600' } });
    const response = await POST(
      makeRequest('http://portal/api/plaa/feedback/items', { method: 'POST', headers: AUTH }),
      context(['items']),
    );
    expect(response.status).toBe(429);
    expect(response.headers.get('retry-after')).toBe('3600');
  });

  it('handles a 204 with no body', async () => {
    upstreamReplies(null, { status: 204 });
    const response = await DELETE(
      makeRequest('http://portal/api/plaa/feedback/comments/c1', { method: 'DELETE', headers: AUTH }),
      context(['comments', 'c1']),
    );
    expect(response.status).toBe(204);
  });
});

describe('AC-T4.3 viewer-specific responses are never shared', () => {
  it.each([['me'], ['triage'], ['items']])('marks /%s private and no-store', async (segment) => {
    upstreamReplies({ ok: true });
    const response = await GET(
      makeRequest(`http://portal/api/plaa/feedback/${segment}`, { headers: AUTH }),
      context([segment]),
    );
    expect(response.headers.get('Cache-Control')).toBe('private, no-store');
  });

  it('asks fetch not to cache the upstream read', async () => {
    upstreamReplies({ ok: true });
    await GET(makeRequest('http://portal/api/plaa/feedback/me', { headers: AUTH }), context(['me']));
    expect(fetchCall()[1].cache).toBe('no-store');
  });
});

describe('AC-T4.4 multipart passes through', () => {
  it('keeps the browser’s Content-Type boundary and the body bytes', async () => {
    upstreamReplies({ id: 'new' }, { status: 201 });
    const boundary = 'multipart/form-data; boundary=----abc123';

    await POST(
      makeRequest('http://portal/api/plaa/feedback/items', {
        method: 'POST',
        headers: { ...AUTH, 'content-type': boundary },
        body: 'payload-bytes',
      }),
      context(['items']),
    );

    const [, init] = fetchCall();
    expect(init.headers['Content-Type']).toBe(boundary);
    expect(Buffer.from(init.body).toString()).toBe('payload-bytes');
  });
});

describe('path and query handling', () => {
  it('builds the upstream path from the catch-all segments', async () => {
    upstreamReplies({ items: [] });
    await GET(
      makeRequest('http://portal/api/plaa/feedback/items/abc/comments', { headers: AUTH }),
      context(['items', 'abc', 'comments']),
    );
    expect(fetchCall()[0]).toBe(`${UPSTREAM}/api/v1/feedback/items/abc/comments`);
  });

  it('forwards only the documented query params', async () => {
    upstreamReplies({ items: [] });
    await GET(
      makeRequest('http://portal/api/plaa/feedback/items?sort=new&type=bug&evil=1', { headers: AUTH }),
      context(['items']),
    );
    const url = fetchCall()[0] as string;
    expect(url).toContain('sort=new');
    expect(url).toContain('type=bug');
    expect(url).not.toContain('evil');
  });

  it('rejects a path segment that tries to escape the feedback namespace', async () => {
    const response = await GET(
      makeRequest('http://portal/api/plaa/feedback/items', { headers: AUTH }),
      context(['..', 'admin']),
    );
    expect(response.status).toBe(400);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('never puts a member identifier in the upstream URL', async () => {
    upstreamReplies({ is_admin: false });
    await GET(makeRequest('http://portal/api/plaa/feedback/me', { headers: AUTH }), context(['me']));
    const url = fetchCall()[0] as string;
    expect(url).not.toMatch(/@/);
    expect(url).not.toContain('member-token');
  });
});
