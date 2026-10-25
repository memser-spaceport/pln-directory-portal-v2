/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';

import { proxy } from '@/proxy';
import { checkIsValidToken, renewAccessToken } from '@/services/auth.service';
import { calculateExpiry, decodeToken } from '@/utils/auth.utils';

jest.mock('@/services/auth.service', () => ({
  checkIsValidToken: jest.fn(),
  renewAccessToken: jest.fn(),
}));

jest.mock('@/utils/auth.utils', () => ({
  calculateExpiry: jest.fn(),
  decodeToken: jest.fn(),
}));

const mockedCheck = checkIsValidToken as jest.Mock;
const mockedRenew = renewAccessToken as jest.Mock;
const mockedExpiry = calculateExpiry as jest.Mock;
const mockedDecode = decodeToken as jest.Mock;

const ORIGIN = 'https://os.pl.xyz';
const TOKEN_RESPONSE_HEADERS = ['authToken', 'refreshToken', 'userInfo'] as const;

const SESSION = {
  authToken: JSON.stringify('access.jwt'),
  refreshToken: JSON.stringify('refresh.jwt'),
  userInfo: JSON.stringify({ uid: 'm-1', name: 'Ada' }),
};

const SPOOFED_AUTH_HEADERS = {
  isLoggedIn: 'true',
  authToken: JSON.stringify('spoofed-access'),
  refreshToken: JSON.stringify('spoofed-refresh'),
  userInfo: encodeURIComponent(JSON.stringify({ uid: 'spoof' })),
};

function request(path: string, cookies: Record<string, string> = {}, headers: Record<string, string> = {}) {
  const cookie = Object.entries(cookies)
    .map(([name, value]) => `${name}=${encodeURIComponent(value)}`)
    .join('; ');
  return new NextRequest(`${ORIGIN}${path}`, {
    headers: { ...(cookie ? { cookie } : {}), ...headers },
  });
}

function forwarded(res: Response, name: string) {
  return res.headers.get(`x-middleware-request-${name.toLowerCase()}`);
}

function expectNoTokenResponseHeaders(res: Response) {
  for (const name of TOKEN_RESPONSE_HEADERS) {
    expect(res.headers.get(name)).toBeNull();
  }
}

async function run(path: string) {
  const res = await proxy(new NextRequest(`${ORIGIN}${path}`));
  const location = res?.headers.get('location');
  return { status: res?.status, location: location ? new URL(location) : null };
}

describe('proxy: legacy AI App ?path= deep links', () => {
  it('redirects /pl-infra-os?path= to the segment URL', async () => {
    const { status, location } = await run('/pl-infra-os?path=%2Fflywheels');

    expect(status).toBe(308);
    expect(location?.pathname).toBe('/pl-infra-os/flywheels');
    expect(location?.search).toBe('');
  });

  it('redirects an app detail link and keeps the other params', async () => {
    const { status, location } = await run('/pl-infra/ai-apps/app-1?path=%2Freports%2F42&settings=deployment');

    expect(status).toBe(308);
    expect(location?.pathname).toBe('/pl-infra/ai-apps/app-1/reports/42');
    expect(location?.search).toBe('?settings=deployment');
  });

  it('keeps only the pathname of the legacy value', async () => {
    const { location } = await run('/pl-infra-os?path=%2Freports%3Ftab%3Dx%23f');

    expect(location?.pathname).toBe('/pl-infra-os/reports');
    expect(location?.search).toBe('');
    expect(location?.hash).toBe('');
  });

  it('drops a trailing slash so the redirect is a single hop', async () => {
    const { location } = await run('/pl-infra-os?path=%2Fflywheels%2F');

    expect(location?.pathname).toBe('/pl-infra-os/flywheels');
  });

  it.each(['//evil.com/x', 'https://evil.com', '/\\evil.com', 'javascript:alert(1)', '/', ''])(
    'lands on the bare app route for a value that is not a same-origin path (%s)',
    async (path) => {
      const params = new URLSearchParams({ path, settings: 'deployment' });
      const { status, location } = await run(`/pl-infra-os?${params}`);

      expect(status).toBe(308);
      expect(location?.pathname).toBe('/pl-infra-os');
      expect(location?.search).toBe('?settings=deployment');
    },
  );

  it('sends a signed-out segment URL to login with the subpage in the backlink, without looping', async () => {
    const { status, location } = await run('/pl-infra-os/flywheels?settings=deployment');

    expect(status).toBe(307);
    expect(location?.pathname).toBe('/members');
    expect(location?.searchParams.get('backlink')).toBe('/pl-infra-os/flywheels?settings=deployment');
    expect(location?.hash).toBe('#login');
  });

  it('leaves ?path= alone outside the app detail routes', async () => {
    const { status, location } = await run('/pl-infra/ai-apps/app-1/prd?path=%2Fx');

    expect(status).toBe(307);
    expect(location?.pathname).toBe('/members');
  });
});

describe('proxy: auth state stays off the page response', () => {
  const previousDomain = process.env.COOKIE_DOMAIN;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.COOKIE_DOMAIN = '.os.pl.xyz';
    mockedExpiry.mockImplementation((exp: number) => exp - Date.now() / 1000);
    mockedDecode.mockImplementation(() => ({ exp: Math.floor(Date.now() / 1000) + 3600 }));
  });

  afterAll(() => {
    if (previousDomain === undefined) delete process.env.COOKIE_DOMAIN;
    else process.env.COOKIE_DOMAIN = previousDomain;
  });

  it('renders a signed-in page from the session cookies and omits token headers', async () => {
    mockedCheck.mockResolvedValue({ active: true });

    const res = await proxy(request('/home', SESSION, SPOOFED_AUTH_HEADERS));

    expect(res?.status).toBe(200);
    expectNoTokenResponseHeaders(res!);
    expect(forwarded(res!, 'isLoggedIn')).toBe('true');
    expect(forwarded(res!, 'authToken')).toBe(SESSION.authToken);
    expect(forwarded(res!, 'refreshToken')).toBe(SESSION.refreshToken);
    expect(forwarded(res!, 'userInfo')).toBe(encodeURIComponent(SESSION.userInfo));
  });

  it('renews an expired access token on the first response, with no token headers', async () => {
    mockedCheck.mockResolvedValue({ active: false });
    mockedRenew.mockResolvedValue({
      data: { accessToken: 'access.new', refreshToken: 'refresh.new', userInfo: { uid: 'm-1' } },
    });

    const res = await proxy(request('/home', SESSION, SPOOFED_AUTH_HEADERS));

    expect(res?.status).toBe(200);
    expectNoTokenResponseHeaders(res!);
    expect(forwarded(res!, 'isLoggedIn')).toBe('true');
    expect(forwarded(res!, 'authToken')).toBe(JSON.stringify('access.new'));
    expect(forwarded(res!, 'refreshToken')).toBe(JSON.stringify('refresh.new'));
    expect(forwarded(res!, 'userInfo')).toBe(encodeURIComponent(JSON.stringify({ uid: 'm-1' })));
    expect(res!.headers.getSetCookie().some((line) => line.startsWith('authToken='))).toBe(true);
  });

  it('ignores client auth headers when the visitor has no session', async () => {
    const res = await proxy(request('/home', {}, SPOOFED_AUTH_HEADERS));

    expect(res?.status).toBe(200);
    expectNoTokenResponseHeaders(res!);
    expect(res!.headers.get('isLoggedIn')).toBeNull();
    for (const name of ['isLoggedIn', 'authToken', 'refreshToken', 'userInfo']) {
      expect(forwarded(res!, name)).toBeNull();
    }
  });

  it('still sends a protected page to login when the client sends auth headers and no session', async () => {
    const res = await proxy(request('/investors', {}, SPOOFED_AUTH_HEADERS));

    expect(res?.status).toBe(307);
    expect(res!.headers.get('location')).toContain('/members');
    expectNoTokenResponseHeaders(res!);
  });
});
