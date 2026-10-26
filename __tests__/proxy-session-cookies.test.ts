/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';

import { proxy } from '@/proxy';
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

function request(path: string, cookies: Record<string, string>, origin = ORIGIN, extra: Record<string, string> = {}) {
  const cookie = Object.entries(cookies)
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join('; ');
  return new NextRequest(`${origin}${path}`, { headers: { ...(cookie ? { cookie } : {}), ...extra } });
}

/** Parsed Set-Cookie headers: name → { value, attrs } (a name may appear twice: host-only + Domain expiry). */
function setCookies(res: Response) {
  return res.headers.getSetCookie().map((line) => {
    const [pair, ...attrs] = line.split(';').map((p) => p.trim());
    const [name, ...value] = pair.split('=');
    const a = Object.fromEntries(
      attrs.map((x) => {
        const [k, ...v] = x.split('=');
        return [k.toLowerCase(), v.join('=') || true];
      }),
    );
    return {
      name,
      value: value.join('='),
      domain: a.domain as string | undefined,
      expired: a['max-age'] === '0' || String(a.expires ?? '').includes('1970'),
      secure: a.secure === true,
      sameSite: typeof a.samesite === 'string' ? a.samesite.toLowerCase() : undefined,
    };
  });
}

/** Auth state is forwarded on the request. The page response must not carry the tokens. */
function expectSignedIn(res: Response) {
  expect(res.headers.get('x-middleware-request-isloggedin')).toBe('true');
  expect(res.headers.get('authToken')).toBeNull();
  expect(res.headers.get('refreshToken')).toBeNull();
  expect(res.headers.get('userInfo')).toBeNull();
}

const SESSION = {
  authToken: JSON.stringify('access.jwt'),
  refreshToken: JSON.stringify('refresh.jwt'),
  userInfo: JSON.stringify({ uid: 'm-1', name: 'Ada' }),
};

beforeEach(() => {
  jest.clearAllMocks();
  process.env.COOKIE_DOMAIN = DOMAIN;
  mockedDecode.mockImplementation((token: string) => ({
    exp: nowSec() + (token.startsWith('refresh') ? 30 * 24 * HOUR : HOUR),
  }));
});

describe('proxy: host-only refreshToken/userInfo', () => {
  it('moves a valid session’s refreshToken/userInfo off the shared domain once, keeping the member signed in', async () => {
    mockedCheck.mockResolvedValue({ active: true });

    const res = await proxy(request('/home', SESSION));
    const cookies = setCookies(res!);

    expectSignedIn(res!);
    // Host-only rewrite with the same values.
    expect(cookies).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'refreshToken',
          value: encodeURIComponent(SESSION.refreshToken),
          domain: undefined,
          expired: false,
        }),
        expect.objectContaining({
          name: 'userInfo',
          value: encodeURIComponent(SESSION.userInfo),
          domain: undefined,
          expired: false,
        }),
        expect.objectContaining({ name: 'sessionScope', value: 'host', domain: undefined, expired: false }),
        // Shared copies expired.
        expect.objectContaining({ name: 'refreshToken', domain: DOMAIN, expired: true }),
        expect.objectContaining({ name: 'userInfo', domain: DOMAIN, expired: true }),
      ]),
    );
    // authToken stays exactly as it is: apps still read it.
    expect(cookies.filter((c) => c.name === 'authToken')).toEqual([]);
  });

  it('does nothing to cookies once the session is already host-only', async () => {
    mockedCheck.mockResolvedValue({ active: true });

    const res = await proxy(request('/home', { ...SESSION, sessionScope: 'host' }));

    expectSignedIn(res!);
    expect(setCookies(res!)).toEqual([]);
  });

  it('skips the move but keeps the member signed in when a token cannot be decoded', async () => {
    mockedCheck.mockResolvedValue({ active: true });
    mockedDecode.mockImplementation(() => {
      throw new Error('bad token');
    });
    const spy = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    const res = await proxy(request('/home', SESSION));

    expectSignedIn(res!);
    expect(setCookies(res!)).toEqual([]);
    spy.mockRestore();
  });

  it('writes refreshed refreshToken/userInfo host-only and keeps authToken on the shared domain', async () => {
    mockedCheck.mockResolvedValue({ active: false });
    mockedRenew.mockResolvedValue({
      data: { accessToken: 'access2.jwt', refreshToken: 'refresh2.jwt', userInfo: { uid: 'm-1' } },
    });

    const res = await proxy(request('/home', SESSION));
    const cookies = setCookies(res!);
    const live = cookies.filter((c) => !c.expired);

    expectSignedIn(res!);
    expect(live).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'authToken', domain: DOMAIN }),
        expect.objectContaining({ name: 'refreshToken', domain: undefined }),
        expect.objectContaining({ name: 'userInfo', domain: undefined }),
        expect.objectContaining({ name: 'sessionScope', domain: undefined }),
      ]),
    );
    expect(cookies.filter((c) => c.expired).map((c) => [c.name, c.domain])).toEqual([
      ['refreshToken', DOMAIN],
      ['userInfo', DOMAIN],
    ]);
  });

  it.each<[string, Record<string, string>, () => void]>([
    ['no refresh token', { authToken: SESSION.authToken }, () => undefined],
    ['force logout', SESSION, () => void mockedCheck.mockResolvedValue({ forceLogout: true })],
    ['an error', SESSION, () => void mockedCheck.mockRejectedValue(new Error('down'))],
  ])('clears host-only and shared copies of every session cookie on %s', async (_label, cookies, arrange) => {
    arrange();
    const spy = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    const res = await proxy(request('/home', cookies));
    const cleared = setCookies(res!).filter((c) => c.expired);

    for (const name of ['refreshToken', 'authToken', 'userInfo']) {
      expect(cleared).toEqual(expect.arrayContaining([expect.objectContaining({ name, domain: undefined })]));
      expect(cleared).toEqual(expect.arrayContaining([expect.objectContaining({ name, domain: DOMAIN })]));
    }
    expect(cleared).toEqual(
      expect.arrayContaining([expect.objectContaining({ name: 'sessionScope', domain: undefined })]),
    );
    expect(setCookies(res!).filter((c) => !c.expired)).toEqual([]);
    spy.mockRestore();
  });

  it('adds no Domain headers when COOKIE_DOMAIN is not set (local dev)', async () => {
    delete process.env.COOKIE_DOMAIN;
    mockedCheck.mockResolvedValue({ active: true });

    const res = await proxy(request('/home', SESSION));

    expect(setCookies(res!).some((c) => c.domain)).toBe(false);
    expect(
      setCookies(res!)
        .map((c) => c.name)
        .sort(),
    ).toEqual(['refreshToken', 'sessionScope', 'userInfo']);
  });

  /* Local dev sets COOKIE_DOMAIN=localhost. Browsers read `Domain=localhost` (or an IP) as the host-only cookie
     itself, so an "expire the shared copy" header there deletes the refreshToken set a line earlier — every local
     sign-in then showed "session expired due to inactivity" at once. */
  describe.each(['localhost', '127.0.0.1'])('COOKIE_DOMAIN=%s (no separate shared copy)', (domain) => {
    beforeEach(() => {
      process.env.COOKIE_DOMAIN = domain;
    });

    it('migrates without expiring the cookies it just wrote', async () => {
      mockedCheck.mockResolvedValue({ active: true });

      const cookies = setCookies((await proxy(request('/home', SESSION)))!);

      expect(cookies.filter((c) => c.expired)).toEqual([]);
      expect(cookies.map((c) => c.name).sort()).toEqual(['refreshToken', 'sessionScope', 'userInfo']);
    });

    it('with authToken host-only too (AI_APPS_SHARE_AUTH_TOKEN=false), still expires nothing it wrote', async () => {
      process.env.AI_APPS_SHARE_AUTH_TOKEN = 'false';
      mockedCheck.mockResolvedValue({ active: true });
      try {
        const cookies = setCookies((await proxy(request('/home', SESSION)))!);

        expect(cookies.filter((c) => c.expired)).toEqual([]);
        expect(cookies.map((c) => c.name)).toEqual(expect.arrayContaining(['authToken', 'refreshToken', 'userInfo']));
      } finally {
        delete process.env.AI_APPS_SHARE_AUTH_TOKEN;
      }
    });

    it('renews without expiring the refreshed refreshToken/userInfo', async () => {
      mockedCheck.mockResolvedValue({ active: false });
      mockedRenew.mockResolvedValue({
        data: { accessToken: 'access.new', refreshToken: 'refresh.new', userInfo: { uid: 'm-1' } },
      });

      const res = await proxy(request('/home', SESSION));
      const cookies = setCookies(res!);

      expectSignedIn(res!);
      expect(cookies.filter((c) => c.expired)).toEqual([]);
      expect(cookies).toEqual(
        expect.arrayContaining([expect.objectContaining({ name: 'refreshToken', expired: false })]),
      );
    });
  });
});

describe('proxy: session cookie flags (LAB-2988)', () => {
  const live = (res: Response) => setCookies(res).filter((c) => !c.expired);

  it('sets SameSite=Lax and Secure on every cookie of a refreshed session', async () => {
    mockedCheck.mockResolvedValue({ active: false });
    mockedRenew.mockResolvedValue({
      data: { accessToken: 'access2.jwt', refreshToken: 'refresh2.jwt', userInfo: { uid: 'm-1' } },
    });

    const cookies = live((await proxy(request('/home', SESSION)))!);

    expect(cookies.map((c) => c.name).sort()).toEqual(['authToken', 'refreshToken', 'sessionScope', 'userInfo']);
    for (const c of cookies) expect(c).toEqual(expect.objectContaining({ sameSite: 'lax', secure: true }));
  });

  it('sets the flags on cookies rewritten by the one-time host-only move', async () => {
    mockedCheck.mockResolvedValue({ active: true });

    const cookies = live((await proxy(request('/home', SESSION)))!);

    expect(cookies.length).toBeGreaterThan(0);
    for (const c of cookies) expect(c).toEqual(expect.objectContaining({ sameSite: 'lax', secure: true }));
  });

  it('keeps Secure behind the ingress, where Next sees its own http://localhost address', async () => {
    mockedCheck.mockResolvedValue({ active: false });
    mockedRenew.mockResolvedValue({
      data: { accessToken: 'access2.jwt', refreshToken: 'refresh2.jwt', userInfo: { uid: 'm-1' } },
    });

    const cookies = live(
      (await proxy(
        request('/home', SESSION, 'http://localhost:4200', {
          host: 'directory-portal-lab-2988.os.pl.xyz',
          'x-forwarded-proto': 'https',
        }),
      ))!,
    );

    expect(cookies.length).toBeGreaterThan(0);
    for (const c of cookies) expect(c).toEqual(expect.objectContaining({ sameSite: 'lax', secure: true }));
  });

  it('leaves Secure off on plain-HTTP localhost so local sign-in keeps working', async () => {
    process.env.COOKIE_DOMAIN = 'localhost';
    mockedCheck.mockResolvedValue({ active: false });
    mockedRenew.mockResolvedValue({
      data: { accessToken: 'access2.jwt', refreshToken: 'refresh2.jwt', userInfo: { uid: 'm-1' } },
    });

    const cookies = live((await proxy(request('/home', SESSION, 'http://localhost:4200')))!);

    expect(cookies.length).toBeGreaterThan(0);
    for (const c of cookies) expect(c).toEqual(expect.objectContaining({ sameSite: 'lax', secure: false }));
  });
});

describe('proxy: AI_APPS_SHARE_AUTH_TOKEN=false (LabOS stops sharing authToken)', () => {
  beforeEach(() => {
    process.env.AI_APPS_SHARE_AUTH_TOKEN = 'false';
  });
  afterEach(() => {
    delete process.env.AI_APPS_SHARE_AUTH_TOKEN;
  });

  it('moves authToken host-only too, once, for a session that already had refreshToken/userInfo moved', async () => {
    mockedCheck.mockResolvedValue({ active: true });

    const res = await proxy(request('/home', { ...SESSION, sessionScope: 'host' }));
    const cookies = setCookies(res!);

    expectSignedIn(res!);
    expect(cookies).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'authToken',
          value: encodeURIComponent(SESSION.authToken),
          domain: undefined,
          expired: false,
        }),
        expect.objectContaining({ name: 'authToken', domain: DOMAIN, expired: true }),
        expect.objectContaining({ name: 'sessionScope', value: 'host-all' }),
      ]),
    );
  });

  it('leaves an already fully host-only session alone', async () => {
    mockedCheck.mockResolvedValue({ active: true });
    const res = await proxy(request('/home', { ...SESSION, sessionScope: 'host-all' }));
    expect(setCookies(res!)).toEqual([]);
  });

  it('writes a refreshed authToken host-only and expires its shared copy', async () => {
    mockedCheck.mockResolvedValue({ active: false });
    mockedRenew.mockResolvedValue({
      data: { accessToken: 'access2.jwt', refreshToken: 'refresh2.jwt', userInfo: { uid: 'm-1' } },
    });

    const cookies = setCookies((await proxy(request('/home', SESSION)))!);

    expect(cookies.filter((c) => !c.expired).find((c) => c.name === 'authToken')?.domain).toBeUndefined();
    expect(cookies.filter((c) => c.expired).map((c) => [c.name, c.domain])).toEqual(
      expect.arrayContaining([
        ['authToken', DOMAIN],
        ['refreshToken', DOMAIN],
        ['userInfo', DOMAIN],
      ]),
    );
  });
});
