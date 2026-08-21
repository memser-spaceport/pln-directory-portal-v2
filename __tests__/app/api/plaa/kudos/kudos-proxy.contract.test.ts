/**
 * @jest-environment node
 */
import { GET as getFeed } from '@/app/api/plaa/kudos/route';
import { GET as getPool } from '@/app/api/plaa/kudos/community-pool/route';
import { GET as getRecipients } from '@/app/api/plaa/kudos/recipients/route';
import { POST as postKudos } from '@/app/api/plaa/kudos/community/route';
import { PATCH as patchKudos } from '@/app/api/plaa/kudos/community/[id]/route';
import type { NextRequest } from 'next/server';

const PLAA_API_URL = 'https://plaa.internal.example';

function makeRequest(url: string, opts: { auth?: string; body?: unknown } = {}): NextRequest {
  const headers = new Headers();
  if (opts.auth) headers.set('authorization', opts.auth);
  return {
    headers,
    url,
    json: async () => opts.body,
    text: async () => JSON.stringify(opts.body ?? ''),
  } as unknown as NextRequest;
}

function makeContext(id: string) {
  return { params: Promise.resolve({ id }) };
}

function mockUpstreamOnce(body: unknown, status = 200) {
  (global.fetch as jest.Mock).mockResolvedValueOnce({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  });
}

beforeEach(() => {
  global.fetch = jest.fn();
  process.env.PLAA_API_URL = PLAA_API_URL;
});

describe('kudos proxy routes — auth gate', () => {
  const cases: Array<[string, (req: NextRequest) => Promise<Response>]> = [
    ['feed', getFeed],
    ['community-pool', getPool],
    ['recipients', getRecipients],
    ['community (submit)', postKudos],
  ];

  it.each(cases)('%s: returns 401 when no Authorization header', async (_name, handler) => {
    const res = await handler(makeRequest('http://localhost/api/plaa/kudos'));
    expect(res.status).toBe(401);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it.each(cases)('%s: returns 500 when PLAA_API_URL is missing', async (_name, handler) => {
    delete process.env.PLAA_API_URL;
    const res = await handler(makeRequest('http://localhost/api/plaa/kudos', { auth: 'Bearer t' }));
    expect(res.status).toBe(500);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('community (update): returns 401 when no Authorization header', async () => {
    const res = await patchKudos(makeRequest('http://localhost/api/plaa/kudos/community/kudos-1'), makeContext('kudos-1'));
    expect(res.status).toBe(401);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('community (update): returns 500 when PLAA_API_URL is missing', async () => {
    delete process.env.PLAA_API_URL;
    const res = await patchKudos(
      makeRequest('http://localhost/api/plaa/kudos/community/kudos-1', { auth: 'Bearer t' }),
      makeContext('kudos-1'),
    );
    expect(res.status).toBe(500);
    expect(global.fetch).not.toHaveBeenCalled();
  });
});

describe('kudos proxy routes — upstream contract', () => {
  it('feed: forwards limit+cursor to GET /api/v1/kudos with the auth header verbatim', async () => {
    mockUpstreamOnce({ items: [], nextCursor: null });
    const res = await getFeed(
      makeRequest('http://localhost/api/plaa/kudos?limit=10&cursor=abc&rogue=1', { auth: 'Bearer privy-1' }),
    );

    const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toBe(`${PLAA_API_URL}/api/v1/kudos?limit=10&cursor=abc`);
    expect(url).not.toContain('rogue');
    expect(init.headers.Authorization).toBe('Bearer privy-1');
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ items: [], nextCursor: null });
  });

  it('community-pool: proxies to GET /api/v1/kudos/community-pool', async () => {
    mockUpstreamOnce({ roundId: 'round-18', totalBudget: 100, pointsUsed: 0, pointsRemaining: 100 });
    const res = await getPool(
      makeRequest('http://localhost/api/plaa/kudos/community-pool', { auth: 'Bearer privy-1' }),
    );

    const [url] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url.startsWith(`${PLAA_API_URL}/api/v1/kudos/community-pool`)).toBe(true);
    await expect(res.json()).resolves.toMatchObject({ totalBudget: 100 });
  });

  it('recipients: proxies to GET /api/v1/kudos/recipients', async () => {
    mockUpstreamOnce({ items: [] });
    await getRecipients(makeRequest('http://localhost/api/plaa/kudos/recipients', { auth: 'Bearer privy-1' }));
    expect((global.fetch as jest.Mock).mock.calls[0][0]).toBe(`${PLAA_API_URL}/api/v1/kudos/recipients`);
  });

  it('submit: POSTs the body through to /api/v1/kudos/community', async () => {
    const input = { recipientId: 'uid-1', points: 20, message: 'well done — thank you for the assist' };
    mockUpstreamOnce({ id: 'kudos-1' }, 201);
    const res = await postKudos(
      makeRequest('http://localhost/api/plaa/kudos/community', { auth: 'Bearer privy-1', body: input }),
    );

    const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toBe(`${PLAA_API_URL}/api/v1/kudos/community`);
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body)).toEqual(input);
    expect(res.status).toBe(201);
  });

  it('update: PATCHes the body through to /api/v1/kudos/community/:id', async () => {
    const input = { recipientId: 'uid-2', points: 30, message: 'updated message padded to length requirement' };
    mockUpstreamOnce({ id: 'kudos-1', ...input }, 200);
    const res = await patchKudos(
      makeRequest('http://localhost/api/plaa/kudos/community/kudos-1', { auth: 'Bearer privy-1', body: input }),
      makeContext('kudos-1'),
    );

    const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toBe(`${PLAA_API_URL}/api/v1/kudos/community/kudos-1`);
    expect(init.method).toBe('PATCH');
    expect(init.headers.Authorization).toBe('Bearer privy-1');
    expect(JSON.parse(init.body)).toEqual(input);
    expect(res.status).toBe(200);
  });

  it('update: forwards upstream rejection (e.g. 403 not the original giver) with the body', async () => {
    mockUpstreamOnce({ message: 'Only the original giver can edit this kudos' }, 403);
    const res = await patchKudos(
      makeRequest('http://localhost/api/plaa/kudos/community/kudos-1', {
        auth: 'Bearer privy-1',
        body: { recipientId: 'uid-2', points: 30, message: 'padded message long enough to be valid here' },
      }),
      makeContext('kudos-1'),
    );
    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toEqual({ message: 'Only the original giver can edit this kudos' });
  });

  it('submit: forwards upstream error statuses (e.g. 400 insufficient budget) with the body', async () => {
    mockUpstreamOnce({ message: 'Insufficient budget' }, 400);
    const res = await postKudos(
      makeRequest('http://localhost/api/plaa/kudos/community', {
        auth: 'Bearer privy-1',
        body: { recipientId: 'uid-1', points: 100, message: 'over budget attempt padded to length' },
      }),
    );
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ message: 'Insufficient budget' });
  });

  it('read routes: map upstream failure statuses through (feed 502)', async () => {
    mockUpstreamOnce({}, 502);
    const res = await getFeed(makeRequest('http://localhost/api/plaa/kudos', { auth: 'Bearer privy-1' }));
    expect(res.status).toBe(502);
  });
});
