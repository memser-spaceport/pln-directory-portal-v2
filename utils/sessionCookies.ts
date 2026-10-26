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

const LOOPBACK_HOSTS = ['localhost', '127.0.0.1', '[::1]', '::1'];

/**
 * Flags on every LabOS session cookie, for the proxy and for browser writes alike: SameSite=Lax always; Secure except
 * on plain-HTTP localhost/loopback (local dev). Decided by host, not protocol alone: TLS ends at the load balancer, so
 * the server can see `http:` on a deployed host. `Lax`, not `Strict`: a member arriving from an email or Telegram link
 * must bring the session with them.
 */
export function sessionCookieFlags(location: { protocol: string; hostname: string }) {
  const insecureLocal = location.protocol === 'http:' && LOOPBACK_HOSTS.includes(location.hostname.toLowerCase());
  return { sameSite: 'lax' as const, secure: !insecureLocal };
}

/**
 * Script-readable session marker: the refresh token's `exp` (epoch seconds), never a credential. `refreshToken` is
 * httpOnly, so browser code checks this cookie to know whether a session exists and when it ends. It is written and
 * cleared together with `refreshToken`.
 */
export const SESSION_MARKER_COOKIE = 'sessionExpiresAt';

/** Every cookie that makes up a LabOS session. */
export const SESSION_COOKIES = ['refreshToken', 'authToken', 'userInfo', SESSION_MARKER_COOKIE] as const;

/**
 * Migration marker: which session cookie layout the proxy already rewrote for this browser. `host` =
 * refreshToken/userInfo host-only; `host-all` = authToken as well; the `:2` revision adds the Secure/SameSite flags,
 * the httpOnly refreshToken and the session marker. A switch flip or a new revision re-runs the rewrite once.
 */
export const SESSION_SCOPE_COOKIE = 'sessionScope';
export const sessionScopeValue = () => (shareAuthTokenWithApps() ? 'host:2' : 'host-all:2');

/**
 * The COOKIE_DOMAIN whose copies of a cookie are separate from LabOS's host-only ones, or null when there are none.
 *
 * On a host with no registrable domain — `localhost`, an IP — browsers treat `Domain=<that host>` as the host-only
 * cookie itself, not a second copy. Expiring the "shared" copy there deletes the host-only cookie that was just set:
 * locally (`COOKIE_DOMAIN=localhost`) every sign-in lost its refreshToken on the next request and was shown "Your
 * session has expired due to inactivity" at once. A real domain keeps the two apart, so its shared copy (which reaches
 * AI App subdomains) must still be expired.
 */
export function sharedCookieDomain(): string | null {
  const domain = process.env.COOKIE_DOMAIN?.trim();
  if (!domain) return null;
  const host = domain.replace(/^\./, '').toLowerCase();
  const isIp = /^\d{1,3}(\.\d{1,3}){3}$/.test(host) || host.includes(':');
  return host === 'localhost' || isIp ? null : domain;
}

export const isHostOnlySessionCookie = (name: string) => hostOnlySessionCookies().includes(name);

/**
 * Appends a `Set-Cookie` that expires the COOKIE_DOMAIN copy of each cookie. It is a raw header because
 * `response.cookies` is keyed by name and can't hold a host-only and a domain cookie with the same name at once.
 * ResponseCookies rewrites every Set-Cookie header on each set/delete, so call this after the last
 * `response.cookies` change in a branch.
 */
export function expireSharedCookies(response: NextResponse, names: readonly string[]) {
  const domain = sharedCookieDomain();
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
