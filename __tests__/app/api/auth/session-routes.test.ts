/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';

import { POST as establish } from '@/app/api/auth/session/route';
import { POST as refresh } from '@/app/api/auth/refresh/route';
import { POST as logout } from '@/app/api/auth/logout/route';
import { checkIsValidToken, renewAccessToken } from '@/services/auth.service';
import { decodeToken } from '@/utils/auth.utils';

jest.mock('@/services/auth.service', () => ({
  checkIsValidToken: jest.fn(),
  renewAccessToken: jest.fn(),
}));

jest.mock('@/utils/auth.utils', () => ({
  // Same arithmetic as the real helper; the real module can't be loaded here (circular import via fetch-wrapper).
  calculateExpiry: (tokenExpiry: number) => tokenExpiry - Date.now() / 1000,
  decodeToken: jest.fn(),
}));

const ORIGIN = 'https://os.pl.xyz';
const DOMAIN = '.os.pl.xyz';
const HOUR = 3600;
const mockedCheck = checkIsValidToken as jest.Mock;
const mockedRenew = renewAccessToken as jest.Mock;
const mockedDecode = decodeToken as jest.Mock;
const nowSec = () => Math.floor(Date.now() / 1000);

const TOKENS = { accessToken: 'access.jwt', refreshToken: 'refresh.jwt', userInfo: { uid: 'm-1', name: 'Ada' } };

function post(
  path: string,
  { body, origin = ORIGIN, cookie }: { body?: unknown; origin?: string | null; cookie?: string } = {},
) {
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (origin) headers.origin = origin;
  if (cookie) headers.cookie = cookie;
  return new NextRequest(`${ORIGIN}${path}`, {
    method: 'POST',
    headers,
    body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body),
  });
}

function setCookies(res: Response) {
  return res.headers.getSetCookie().map((line) => {
    const [pair, ...attrs] = line.split(';').map((p) => p.trim());
    const [name, ...value] = pair.split('=');
    const lower = attrs.map((a) => a.toLowerCase());
    return {
      name,
      value: value.join('='),
      httpOnly: lower.includes('httponly'),
      secure: lower.includes('secure'),
      lax: lower.includes('samesite=lax'),
      domain: lower.find((a) => a.startsWith('domain='))?.slice('domain='.length),
      expired: lower.some((a) => a === 'max-age=0' || (a.startsWith('expires=') && a.includes('1970'))),
    };
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  process.env.COOKIE_DOMAIN = DOMAIN;
  mockedDecode.mockImplementation((token: string) =>
    token.endsWith('.jwt') ? { exp: nowSec() + (token.startsWith('refresh') ? 30 * 24 * HOUR : HOUR) } : null,
  );
  mockedCheck.mockResolvedValue({ active: true });
  jest.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterEach(() => {
  (console.error as jest.Mock).mockRestore?.();
});

describe('POST /api/auth/session', () => {
  it('sets the session with an httpOnly refresh token and Secure/SameSite=Lax on every cookie', async () => {
    const res = await establish(post('/api/auth/session', { body: TOKENS }));
    const live = setCookies(res).filter((c) => !c.expired);

    expect(res.status).toBe(204);
    expect(live.map((c) => c.name).sort()).toEqual([
      'authToken',
      'refreshToken',
      'sessionExpiresAt',
      'sessionScope',
      'userInfo',
    ]);
    for (const c of live) {
      expect(c).toEqual(expect.objectContaining({ secure: true, lax: true, httpOnly: c.name === 'refreshToken' }));
    }
    expect(mockedCheck).toHaveBeenCalledWith('access.jwt');
  });

  it.each<[string, string | null]>([
    ['another site', 'https://evil.example'],
    ['an AI App subdomain', 'https://app.os.pl.xyz'],
    ['no Origin', null],
  ])('rejects a request from %s with 403 and sets nothing', async (_label, origin) => {
    const res = await establish(post('/api/auth/session', { body: TOKENS, origin }));
    expect(res.status).toBe(403);
    expect(setCookies(res)).toEqual([]);
    expect(mockedCheck).not.toHaveBeenCalled();
  });

  it.each<[string, unknown]>([
    ['a non-JSON body', 'not json'],
    ['a missing userInfo.uid', { ...TOKENS, userInfo: { name: 'Ada' } }],
    ['a missing refresh token', { accessToken: 'access.jwt', userInfo: { uid: 'm-1' } }],
    ['an undecodable token', { ...TOKENS, refreshToken: 'garbage' }],
  ])('rejects %s with 400 and sets nothing', async (_label, body) => {
    const res = await establish(post('/api/auth/session', { body }));
    expect(res.status).toBe(400);
    expect(setCookies(res)).toEqual([]);
  });

  it('rejects an expired token', async () => {
    mockedDecode.mockImplementation((token: string) => ({
      exp: token.startsWith('refresh') ? nowSec() - 10 : nowSec() + HOUR,
    }));
    const res = await establish(post('/api/auth/session', { body: TOKENS }));
    expect(res.status).toBe(400);
    expect(setCookies(res)).toEqual([]);
  });

  it.each([[{ active: false }], [{ active: true, forceLogout: true }], [null]])(
    'rejects an access token the auth service does not accept (%j)',
    async (introspection) => {
      mockedCheck.mockResolvedValue(introspection);
      const res = await establish(post('/api/auth/session', { body: TOKENS }));
      expect(res.status).toBe(400);
      expect(setCookies(res)).toEqual([]);
    },
  );
});

describe('POST /api/auth/refresh', () => {
  const cookie = `refreshToken=${encodeURIComponent(JSON.stringify('refresh.jwt'))}`;

  it('renews from the httpOnly cookie and never returns the refresh token to the browser', async () => {
    mockedRenew.mockResolvedValue({
      ok: true,
      data: { accessToken: 'access2.jwt', refreshToken: 'refresh2.jwt', userInfo: { uid: 'm-1' } },
    });

    const res = await refresh(post('/api/auth/refresh', { cookie }));
    const body = await res.json();
    const refreshCookie = setCookies(res).find((c) => c.name === 'refreshToken' && !c.expired);

    expect(mockedRenew).toHaveBeenCalledWith('refresh.jwt');
    expect(res.status).toBe(200);
    expect(body).toEqual({ accessToken: 'access2.jwt', userInfo: { uid: 'm-1' } });
    expect(JSON.stringify(body)).not.toContain('refresh2');
    expect(refreshCookie).toEqual(
      expect.objectContaining({
        value: encodeURIComponent(JSON.stringify('refresh2.jwt')),
        httpOnly: true,
        secure: true,
      }),
    );
  });

  it.each<[string, () => void]>([
    ['the API rejects the token', () => void mockedRenew.mockResolvedValue({ ok: false, status: 401, data: {} })],
    ['the API is down', () => void mockedRenew.mockRejectedValue(new Error('down'))],
  ])('answers 401 and clears the session when %s', async (_label, arrange) => {
    arrange();
    const res = await refresh(post('/api/auth/refresh', { cookie }));
    const cleared = setCookies(res).filter((c) => c.expired);

    expect(res.status).toBe(401);
    for (const name of ['refreshToken', 'authToken', 'userInfo', 'sessionExpiresAt']) {
      expect(cleared).toEqual(expect.arrayContaining([expect.objectContaining({ name, domain: undefined })]));
    }
    expect(setCookies(res).filter((c) => !c.expired)).toEqual([]);
  });

  it('answers 401 without calling the API when there is no refresh cookie', async () => {
    const res = await refresh(post('/api/auth/refresh'));
    expect(res.status).toBe(401);
    expect(mockedRenew).not.toHaveBeenCalled();
  });

  it('rejects a cross-site request with 403', async () => {
    const res = await refresh(post('/api/auth/refresh', { cookie, origin: 'https://evil.example' }));
    expect(res.status).toBe(403);
    expect(mockedRenew).not.toHaveBeenCalled();
  });
});

describe('POST /api/auth/logout', () => {
  it('expires host-only and shared copies of every session cookie and the markers', async () => {
    const res = await logout(post('/api/auth/logout'));
    const cleared = setCookies(res).filter((c) => c.expired);

    expect(res.status).toBe(204);
    for (const name of ['refreshToken', 'authToken', 'userInfo', 'sessionExpiresAt']) {
      expect(cleared).toEqual(expect.arrayContaining([expect.objectContaining({ name, domain: undefined })]));
      expect(cleared).toEqual(expect.arrayContaining([expect.objectContaining({ name, domain: DOMAIN })]));
    }
    expect(cleared).toEqual(expect.arrayContaining([expect.objectContaining({ name: 'sessionScope' })]));
  });

  it('rejects a cross-site request with 403 and clears nothing', async () => {
    const res = await logout(post('/api/auth/logout', { origin: 'https://evil.example' }));
    expect(res.status).toBe(403);
    expect(setCookies(res)).toEqual([]);
  });
});
