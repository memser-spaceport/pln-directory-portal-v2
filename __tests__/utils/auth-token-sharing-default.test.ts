/**
 * @jest-environment node
 */
import { NextRequest, NextResponse } from 'next/server';

import { decodeToken } from '@/utils/auth.utils';
import { shareAuthTokenWithApps } from '@/utils/sessionCookies';
import { sessionCookieAttributes, setSessionCookies } from '@/utils/sessionResponse';

jest.mock('@/utils/auth.utils', () => ({
  // Same arithmetic as the real helper; the real module can't be loaded here (circular import via fetch-wrapper).
  calculateExpiry: (tokenExpiry: number) => tokenExpiry - Date.now() / 1000,
  decodeToken: jest.fn(),
}));

/*
 * The authToken cookie is the member's directory API bearer token and is readable by page scripts. On COOKIE_DOMAIN
 * it would reach every deployed AI App on a sibling subdomain, so sharing must be an explicit opt-in.
 */

const DOMAIN = '.os.pl.xyz';
const req = () => new NextRequest('https://os.pl.xyz/home');

beforeEach(() => {
  process.env.COOKIE_DOMAIN = DOMAIN;
  delete process.env.AI_APPS_SHARE_AUTH_TOKEN;
  (decodeToken as jest.Mock).mockReturnValue({ exp: Math.floor(Date.now() / 1000) + 3600 });
});

afterAll(() => {
  delete process.env.AI_APPS_SHARE_AUTH_TOKEN;
});

describe('authToken sharing with AI Apps is off unless explicitly enabled', () => {
  it('does not share authToken when AI_APPS_SHARE_AUTH_TOKEN is unset', () => {
    expect(shareAuthTokenWithApps()).toBe(false);
    expect(sessionCookieAttributes('authToken', req()).domain).toBeUndefined();
  });

  it.each(['', ' ', 'false', '0', 'no', 'yes', '1'])('does not share authToken for %j', (value) => {
    process.env.AI_APPS_SHARE_AUTH_TOKEN = value;
    expect(shareAuthTokenWithApps()).toBe(false);
    expect(sessionCookieAttributes('authToken', req()).domain).toBeUndefined();
  });

  it.each(['true', 'TRUE', ' true '])('shares authToken on COOKIE_DOMAIN only when set to %j', (value) => {
    process.env.AI_APPS_SHARE_AUTH_TOKEN = value;
    expect(shareAuthTokenWithApps()).toBe(true);
    expect(sessionCookieAttributes('authToken', req()).domain).toBe(DOMAIN);
  });

  it('writes a new session with a host-only authToken and expires the old shared copy', () => {
    const response = NextResponse.next();
    setSessionCookies(response, req(), { accessToken: 'access', refreshToken: 'refresh', userInfo: {} });

    const lines = response.headers.getSetCookie().filter((line) => line.startsWith('authToken='));
    const written = lines.filter((line) => !/Max-Age=0/i.test(line));
    expect(written).toHaveLength(1);
    expect(written[0]).not.toMatch(/Domain=/i);
    expect(lines).toContain(`authToken=; Domain=${DOMAIN}; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT`);
  });
});
