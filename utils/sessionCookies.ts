import type { NextResponse } from 'next/server';

/**
 * Whether LabOS still shares `authToken` with deployed AI Apps on COOKIE_DOMAIN (LAB-2695). On until every app's
 * auth gate issues its own sessions; `AI_APPS_SHARE_AUTH_TOKEN=false` makes `authToken` host-only too.
 */
export const shareAuthTokenWithApps = () =>
  (process.env.AI_APPS_SHARE_AUTH_TOKEN ?? 'true').trim().toLowerCase() !== 'false';

/**
 * LabOS session cookies kept host-only on LabOS's own origin. Deployed AI Apps run on sibling subdomains of
 * COOKIE_DOMAIN, so a copy on the shared domain would reach every app (and its server) — for refreshToken that is a
 * credential that mints new sessions. `authToken` joins them once LabOS stops sharing it (shareAuthTokenWithApps).
 */
export const hostOnlySessionCookies = (): readonly string[] =>
  shareAuthTokenWithApps() ? ['refreshToken', 'userInfo'] : ['refreshToken', 'userInfo', 'authToken'];

/** Every cookie that makes up a LabOS session. */
export const SESSION_COOKIES = ['refreshToken', 'authToken', 'userInfo'] as const;

/**
 * Host-only marker: which session cookies the middleware already rewrote host-only for this browser. `host` =
 * refreshToken/userInfo; `host-all` = authToken as well. A switch flip re-runs the move once.
 */
export const SESSION_SCOPE_COOKIE = 'sessionScope';
export const sessionScopeValue = () => (shareAuthTokenWithApps() ? 'host' : 'host-all');

export const isHostOnlySessionCookie = (name: string) => hostOnlySessionCookies().includes(name);

/**
 * Appends a `Set-Cookie` that expires the COOKIE_DOMAIN copy of each cookie. It is a raw header because
 * `response.cookies` is keyed by name and can't hold a host-only and a domain cookie with the same name at once.
 * ResponseCookies rewrites every Set-Cookie header on each set/delete, so call this after the last
 * `response.cookies` change in a branch.
 */
export function expireSharedCookies(response: NextResponse, names: readonly string[]) {
  const domain = process.env.COOKIE_DOMAIN;
  if (!domain) return;
  for (const name of names) {
    response.headers.append(
      'set-cookie',
      `${name}=; Domain=${domain}; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT`,
    );
  }
}

/** Ends the session in the browser: host-only and shared copies of every session cookie. */
export function clearSessionCookies(response: NextResponse) {
  for (const name of [...SESSION_COOKIES, SESSION_SCOPE_COOKIE]) {
    response.cookies.delete(name);
  }
  expireSharedCookies(response, SESSION_COOKIES);
}
