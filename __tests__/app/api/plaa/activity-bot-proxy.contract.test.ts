/**
 * @jest-environment node
 */
import { generateKeyPairSync } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';

import { POST as postTurn } from '@/app/api/plaa/activity-bot/route';

const WEBHOOK_URL = 'https://bot.internal.example/webhook/plaa-activity-bot';
const DIRECTORY_API_URL = 'https://directory.internal.example';
const ACCESS_URL = `${DIRECTORY_API_URL}/v2/access-control-v2/me/access`;
const TURN = { sessionId: 'session-1', activityId: 'network_introduction', message: 'hello' };
const { privateKey, publicKey } = generateKeyPairSync('ec', { namedCurve: 'P-256' });
const PRIVATE_PEM = privateKey.export({ type: 'pkcs8', format: 'pem' }) as string;
const PUBLIC_PEM = publicKey.export({ type: 'spki', format: 'pem' }) as string;

function forwardedClaims() {
  const [, init] = callsTo(WEBHOOK_URL)[0];
  const token = String(init.headers.Authorization).replace(/^Bearer /, '');
  return jwt.verify(token, PUBLIC_PEM, { algorithms: ['ES256'] }) as jwt.JwtPayload;
}

interface RequestOptions {
  body?: unknown;
  cookie?: string | null;
  contentType?: string;
  headers?: Record<string, string>;
  url?: string;
}

function makeRequest({
  body = TURN,
  cookie = 'authToken=%22member-token%22',
  contentType = 'application/json',
  headers = {},
  url = 'https://portal.example/api/plaa/activity-bot',
}: RequestOptions = {}) {
  return new NextRequest(url, {
    method: 'POST',
    headers: { 'content-type': contentType, ...(cookie ? { cookie } : {}), ...headers },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

interface UpstreamOptions {
  access?: { ok: boolean; body: Record<string, unknown> };
  bot?: { status: number; body: Record<string, unknown> };
}

function mockUpstream({
  access = { ok: true, body: { memberUid: 'member-uid-1' } },
  bot = { status: 200, body: { output: 'Hi' } },
}: UpstreamOptions = {}) {
  (global.fetch as jest.Mock).mockImplementation(async (url: string) => {
    if (url === ACCESS_URL) {
      return { ok: access.ok, status: access.ok ? 200 : 401, json: async () => access.body };
    }
    return { ok: bot.status < 400, status: bot.status, json: async () => bot.body };
  });
}

const callsTo = (url: string) => (global.fetch as jest.Mock).mock.calls.filter(([calledUrl]) => calledUrl === url);

beforeEach(() => {
  process.env.PLAA_BOT_WEBHOOK_URL = WEBHOOK_URL;
  process.env.PLAA_BOT_SIGNING_KEY = PRIVATE_PEM;
  process.env.DIRECTORY_API_URL = DIRECTORY_API_URL;
  global.fetch = jest.fn();
  mockUpstream();
});

describe('activity bot proxy route', () => {
  it('returns 503 and calls nothing when the bot is not configured', async () => {
    delete process.env.PLAA_BOT_WEBHOOK_URL;

    const res = await postTurn(makeRequest());

    expect(res.status).toBe(503);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('rejects a request that is not JSON, so a cross-site form post cannot reach it', async () => {
    const res = await postTurn(makeRequest({ contentType: 'text/plain' }));

    expect(res.status).toBe(415);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('rejects a request from another origin', async () => {
    const res = await postTurn(makeRequest({ headers: { origin: 'https://evil.example' } }));

    expect(res.status).toBe(403);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  describe('behind a proxy, where the app sees an internal address', () => {
    const INTERNAL_URL = 'http://10.0.0.5:3000/api/plaa/activity-bot';

    beforeEach(() => {
      process.env.APPLICATION_BASE_URL = 'https://portal.example/';
    });
    afterEach(() => {
      delete process.env.APPLICATION_BASE_URL;
    });

    it("accepts a request from the site's public origin", async () => {
      const res = await postTurn(makeRequest({ url: INTERNAL_URL, headers: { origin: 'https://portal.example' } }));

      expect(res.status).toBe(200);
      expect(callsTo(WEBHOOK_URL)).toHaveLength(1);
    });

    it('still rejects a request from another origin', async () => {
      const res = await postTurn(makeRequest({ url: INTERNAL_URL, headers: { origin: 'https://evil.example' } }));

      expect(res.status).toBe(403);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('rejects the internal address as an origin', async () => {
      const res = await postTurn(makeRequest({ url: INTERNAL_URL, headers: { origin: 'http://10.0.0.5:3000' } }));

      expect(res.status).toBe(403);
    });
  });

  it('returns 401 without a session cookie', async () => {
    const res = await postTurn(makeRequest({ cookie: null }));

    expect(res.status).toBe(401);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('returns 401 and does not call the bot when the session is not valid', async () => {
    mockUpstream({ access: { ok: false, body: {} } });

    const res = await postTurn(makeRequest());

    expect(res.status).toBe(401);
    expect(callsTo(WEBHOOK_URL)).toHaveLength(0);
  });

  it('returns 401 when the session resolves to no member', async () => {
    mockUpstream({ access: { ok: true, body: { memberUid: '' } } });

    const res = await postTurn(makeRequest());

    expect(res.status).toBe(401);
    expect(callsTo(WEBHOOK_URL)).toHaveLength(0);
  });

  it('checks the session with the token from the cookie', async () => {
    await postTurn(makeRequest());

    const [, init] = callsTo(ACCESS_URL)[0];
    expect(init.headers.Authorization).toBe('Bearer member-token');
  });

  it('forwards the turn with a token it signed for the verified member and this session', async () => {
    await postTurn(makeRequest());

    const [, init] = callsTo(WEBHOOK_URL)[0];
    const claims = forwardedClaims();
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body)).toEqual(TURN);
    expect(claims.sub).toBe('member-uid-1');
    expect(claims.sid).toBe('session-1');
    expect(claims.aud).toBe('plaa-activity-bot');
  });

  it('signs a token that lasts one minute', async () => {
    await postTurn(makeRequest());

    const claims = forwardedClaims();
    expect((claims.exp as number) - (claims.iat as number)).toBe(60);
  });

  it('accepts a signing key whose line breaks are written as \\n', async () => {
    process.env.PLAA_BOT_SIGNING_KEY = PRIVATE_PEM.replace(/\n/g, '\\n');

    await postTurn(makeRequest());

    expect(forwardedClaims().sub).toBe('member-uid-1');
  });

  it('sends no shared secret and no member header', async () => {
    await postTurn(makeRequest());

    const headerNames = Object.keys(callsTo(WEBHOOK_URL)[0][1].headers).map((name) => name.toLowerCase());
    expect(headerNames.sort()).toEqual(['authorization', 'content-type']);
  });

  it('ignores a member uid supplied by the browser, in a header or in the body', async () => {
    await postTurn(
      makeRequest({
        body: { ...TURN, memberUid: 'someone-else', identity: { memberId: 'someone-else' } },
        headers: { 'x-plaa-member-uid': 'someone-else' },
      }),
    );

    const [, init] = callsTo(WEBHOOK_URL)[0];
    expect(forwardedClaims().sub).toBe('member-uid-1');
    expect(JSON.parse(init.body)).toEqual(TURN);
  });

  it('forwards the privacy acknowledgement event', async () => {
    const event = { sessionId: 'session-1', activityId: 'x_space', event: 'privacy_acknowledged' };

    await postTurn(makeRequest({ body: event }));

    expect(JSON.parse(callsTo(WEBHOOK_URL)[0][1].body)).toEqual(event);
  });

  it.each([
    ['no session id', { activityId: 'x_space', message: 'hi' }],
    ['an activity id with a path in it', { sessionId: 's', activityId: '../x', message: 'hi' }],
    ['a message over 2000 characters', { sessionId: 's', activityId: 'x_space', message: 'a'.repeat(2001) }],
    ['an unknown event', { sessionId: 's', activityId: 'x_space', event: 'something_else' }],
    ['a body that is not an object', 'not json'],
  ])('returns 400 for %s', async (_label, body) => {
    const res = await postTurn(makeRequest({ body }));

    expect(res.status).toBe(400);
    expect(callsTo(WEBHOOK_URL)).toHaveLength(0);
  });

  it('returns the bot reply and status as they are', async () => {
    mockUpstream({ bot: { status: 200, body: { output: 'Submitted', event: 'receipt' } } });

    const res = await postTurn(makeRequest());

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ output: 'Submitted', event: 'receipt' });
  });

  it('returns 502 when the bot cannot be reached', async () => {
    (global.fetch as jest.Mock).mockImplementation(async (url: string) => {
      if (url === ACCESS_URL) return { ok: true, status: 200, json: async () => ({ memberUid: 'member-uid-1' }) };
      throw new Error('network');
    });

    const res = await postTurn(makeRequest());

    expect(res.status).toBe(502);
  });
});
