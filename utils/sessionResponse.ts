import type { NextRequest, NextResponse } from 'next/server';
import { calculateExpiry, decodeToken } from './auth.utils';
import {
  expireSharedCookies,
  hostOnlySessionCookies,
  SESSION_MARKER_COOKIE,
  SESSION_SCOPE_COOKIE,
  sessionScopeValue,
} from './sessionCookies';

/**
 * Server-side writers for the LabOS session cookies: the proxy and the `/api/auth/*` route handlers. Every session
 * cookie is set here, so its flags are decided in one place.
 */

interface SessionCookieAttributes {
  path: string;
  sameSite: 'lax';
  secure: boolean;
  httpOnly: boolean;
  domain?: string;
}

const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]', '::1']);

/**
 * Plain HTTP to localhost/loopback (local dev) is the only case where cookies go without `Secure`. TLS ends at the
 * load balancer on deployed environments, so the request's own protocol can read `http:` there; the host can't be
 * loopback.
 */
export function isInsecureLocalRequest(req: NextRequest): boolean {
  return req.nextUrl.protocol === 'http:' && LOOPBACK_HOSTS.has(req.nextUrl.hostname.toLowerCase());
}

/**
 * Attributes for one session cookie: `SameSite=Lax` and `Path=/` on all, `Secure` outside local HTTP, `httpOnly` on
 * `refreshToken` only. Host-only cookies (see hostOnlySessionCookies) get no Domain; `authToken` goes on COOKIE_DOMAIN
 * while LabOS shares it with AI Apps. `Lax`, not `Strict`: a member arriving from an email or Telegram link must
 * bring the session with them.
 */
export function sessionCookieAttributes(name: string, req: NextRequest): SessionCookieAttributes {
  const shared = name === 'authToken' && !hostOnlySessionCookies().includes(name) && process.env.COOKIE_DOMAIN;
  return {
    path: '/',
    sameSite: 'lax',
    secure: !isInsecureLocalRequest(req),
    httpOnly: name === 'refreshToken',
    ...(shared ? { domain: process.env.COOKIE_DOMAIN } : {}),
  };
}

export interface SessionTokens {
  accessToken: string;
  refreshToken: string;
  userInfo: unknown;
}

/**
 * Writes a whole session: authToken, refreshToken, userInfo, the migration marker and the session marker, then
 * expires the shared copies of the host-only ones. Throws when a token can't be decoded. Call it after any other
 * `response.cookies` change (see expireSharedCookies).
 */
export function setSessionCookies(response: NextResponse, req: NextRequest, tokens: SessionTokens) {
  const accessExp = (decodeToken(tokens.accessToken) as any)?.exp;
  const refreshExp = (decodeToken(tokens.refreshToken) as any)?.exp;
  if (typeof accessExp !== 'number' || typeof refreshExp !== 'number') {
    throw new Error('Session token has no expiry');
  }
  const accessMaxAge = calculateExpiry(accessExp);
  const refreshMaxAge = calculateExpiry(refreshExp);
  const set = (name: string, value: string, maxAge: number) =>
    response.cookies.set({ name, value, maxAge, ...sessionCookieAttributes(name, req) });

  set('refreshToken', JSON.stringify(tokens.refreshToken), refreshMaxAge);
  set('authToken', JSON.stringify(tokens.accessToken), accessMaxAge);
  set('userInfo', JSON.stringify(tokens.userInfo), accessMaxAge);
  set(SESSION_SCOPE_COOKIE, sessionScopeValue(), refreshMaxAge);
  set(SESSION_MARKER_COOKIE, String(refreshExp), refreshMaxAge);
  expireSharedCookies(response, hostOnlySessionCookies());
}

/**
 * True when the request comes from a LabOS page on this host. Compares hosts, not origins: behind the load balancer
 * the server can see `http:` while the browser's Origin says `https:`.
 */
export function isSameOriginRequest(req: NextRequest): boolean {
  const origin = req.headers.get('origin');
  if (!origin) return false;
  try {
    return new URL(origin).host === req.nextUrl.host;
  } catch {
    return false;
  }
}
