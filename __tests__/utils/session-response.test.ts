/**
 * @jest-environment node
 */
import { NextRequest, NextResponse } from 'next/server';

import { clearSessionCookies } from '@/utils/sessionCookies';
import { isSameOriginRequest, sessionCookieAttributes, setSessionCookies } from '@/utils/sessionResponse';
import { decodeToken } from '@/utils/auth.utils';

jest.mock('@/utils/auth.utils', () => ({
  // Same arithmetic as the real helper; the real module can't be loaded here (circular import via fetch-wrapper).
  calculateExpiry: (tokenExpiry: number) => tokenExpiry - Date.now() / 1000,
  decodeToken: jest.fn(),
}));

const DOMAIN = '.os.pl.xyz';
const HOUR = 3600;
const mockedDecode = decodeToken as jest.Mock;
const nowSec = () => Math.floor(Date.now() / 1000);

const req = (url = 'https://os.pl.xyz/home', headers: Record<string, string> = {}) => new NextRequest(url, { headers });

function parse(res: Response) {
  return res.headers.getSetCookie().map((line) => {
    const [pair, ...attrs] = line.split(';').map((p) => p.trim());
    const [name, ...value] = pair.split('=');
    const a = Object.fromEntries(
      attrs.map((x) => {
        const [k, ...v] = x.split('=');
        return [k.toLowerCase(), v.join('=') || true];
      }),
    );
    return { name, value: value.join('='), attrs: a };
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  process.env.COOKIE_DOMAIN = DOMAIN;
  delete process.env.AI_APPS_SHARE_AUTH_TOKEN;
  mockedDecode.mockImplementation((token: string) => ({
    exp: nowSec() + (token.startsWith('refresh') ? 30 * 24 * HOUR : HOUR),
  }));
});

describe('sessionCookieAttributes', () => {
  it.each(['refreshToken', 'authToken', 'userInfo', 'sessionScope', 'sessionExpiresAt'])(
    '%s: SameSite=Lax, Path=/, Secure on HTTPS, httpOnly only for refreshToken',
    (name) => {
      expect(sessionCookieAttributes(name, req())).toEqual(
        expect.objectContaining({ path: '/', sameSite: 'lax', secure: true, httpOnly: name === 'refreshToken' }),
      );
    },
  );

  it.each(['http://localhost:4200/home', 'http://127.0.0.1:4200/home'])(
    'no Secure on plain-HTTP loopback (%s)',
    (url) => {
      expect(sessionCookieAttributes('refreshToken', req(url))).toEqual(
        expect.objectContaining({ secure: false, httpOnly: true, sameSite: 'lax' }),
      );
    },
  );

  it('keeps Secure on a deployed host even when the server sees http: (TLS ends at the load balancer)', () => {
    expect(sessionCookieAttributes('authToken', req('http://os.pl.xyz/home')).secure).toBe(true);
  });

  it('puts authToken on COOKIE_DOMAIN while sharing is on, host-only once it is off', () => {
    expect(sessionCookieAttributes('authToken', req()).domain).toBe(DOMAIN);
    process.env.AI_APPS_SHARE_AUTH_TOKEN = 'false';
    expect(sessionCookieAttributes('authToken', req()).domain).toBeUndefined();
  });

  it.each(['refreshToken', 'userInfo', 'sessionScope', 'sessionExpiresAt'])(
    'never puts %s on the shared domain',
    (n) => {
      expect(sessionCookieAttributes(n, req()).domain).toBeUndefined();
    },
  );
});

describe('setSessionCookies', () => {
  it('writes the whole session with the flags and expires the shared host-only copies last', () => {
    const res = NextResponse.next();
    setSessionCookies(res, req(), { accessToken: 'access.jwt', refreshToken: 'refresh.jwt', userInfo: { uid: 'm-1' } });
    const cookies = parse(res);
    const live = cookies.filter((c) => c.value !== '');

    expect(live.map((c) => c.name).sort()).toEqual([
      'authToken',
      'refreshToken',
      'sessionExpiresAt',
      'sessionScope',
      'userInfo',
    ]);
    for (const c of live) {
      expect(c.attrs.samesite).toMatch(/lax/i);
      expect(c.attrs.secure).toBe(true);
      expect(c.attrs.httponly === true).toBe(c.name === 'refreshToken');
    }
    expect(live.find((c) => c.name === 'sessionExpiresAt')?.value).toBe(String(mockedDecode('refresh.jwt').exp));
    expect(cookies.filter((c) => c.value === '').map((c) => [c.name, c.attrs.domain])).toEqual([
      ['refreshToken', DOMAIN],
      ['userInfo', DOMAIN],
    ]);
  });

  it('throws without writing when a token has no expiry', () => {
    mockedDecode.mockReturnValue(null);
    const res = NextResponse.next();
    expect(() => setSessionCookies(res, req(), { accessToken: 'x', refreshToken: 'y', userInfo: {} })).toThrow();
    expect(parse(res)).toEqual([]);
  });

  it('clearSessionCookies removes the session marker too', () => {
    const res = NextResponse.next();
    clearSessionCookies(res);
    const names = parse(res).map((c) => c.name);
    expect(names).toEqual(expect.arrayContaining(['refreshToken', 'sessionExpiresAt', 'sessionScope']));
  });
});

describe('isSameOriginRequest', () => {
  it('accepts an Origin on the same host, also when the server sees http:', () => {
    expect(isSameOriginRequest(req('https://os.pl.xyz/api/auth/session', { origin: 'https://os.pl.xyz' }))).toBe(true);
    expect(isSameOriginRequest(req('http://os.pl.xyz/api/auth/session', { origin: 'https://os.pl.xyz' }))).toBe(true);
  });

  it.each([
    ['another site', 'https://evil.example'],
    ['a sibling AI App subdomain', 'https://app.os.pl.xyz'],
    ['an unparsable Origin', 'null'],
  ])('rejects %s', (_label, origin) => {
    expect(isSameOriginRequest(req('https://os.pl.xyz/api/auth/session', { origin }))).toBe(false);
  });

  it('rejects a request without Origin', () => {
    expect(isSameOriginRequest(req('https://os.pl.xyz/api/auth/session'))).toBe(false);
  });
});
