import type { NextResponse } from 'next/server';

/**
 * LabOS session cookies kept host-only on LabOS's own origin. Deployed AI Apps run on sibling subdomains of
 * COOKIE_DOMAIN, so a copy on the shared domain would reach every app (and its server) — for refreshToken that is a
 * credential that mints new sessions. `authToken` is not in this list: apps and their auth gate still read it.
 */
export const HOST_ONLY_SESSION_COOKIES = ['refreshToken', 'userInfo'] as const;

/** Every cookie that makes up a LabOS session. */
export const SESSION_COOKIES = ['refreshToken', 'authToken', 'userInfo'] as const;

/** Host-only marker: this browser's refreshToken/userInfo were already rewritten host-only by the middleware. */
export const SESSION_SCOPE_COOKIE = 'sessionScope';
export const SESSION_SCOPE_HOST = 'host';

export const isHostOnlySessionCookie = (name: string) =>
  (HOST_ONLY_SESSION_COOKIES as readonly string[]).includes(name);

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
