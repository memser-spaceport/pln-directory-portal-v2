import type { NextRequest, NextResponse } from 'next/server';
import { calculateExpiry, decodeToken } from './auth.utils';
import {
  expireSharedCookies,
  hostOnlySessionCookies,
  SESSION_MARKER_COOKIE,
  SESSION_SCOPE_COOKIE,
  publicRequestLocation,
  sessionCookieFlags,
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

/**
 * Attributes for one session cookie: `Path=/`, the shared SameSite/Secure rule (sessionCookieFlags), `httpOnly` on
 * `refreshToken` only. Host-only cookies (see hostOnlySessionCookies) get no Domain; `authToken` goes on COOKIE_DOMAIN
 * while LabOS shares it with AI Apps.
 */
export function sessionCookieAttributes(name: string, req: NextRequest): SessionCookieAttributes {
  const shared = name === 'authToken' && !hostOnlySessionCookies().includes(name) && process.env.COOKIE_DOMAIN;
  return {
    path: '/',
    ...sessionCookieFlags(publicRequestLocation(req)),
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
 * True when the request comes from a LabOS page on this host: the browser's Origin host equals the public host the
 * request was sent to (publicRequestLocation; behind the ingress `req.nextUrl` carries the pod's own address).
 */
export function isSameOriginRequest(req: NextRequest): boolean {
  const origin = req.headers.get('origin');
  if (!origin) return false;
  try {
    return new URL(origin).host === publicRequestLocation(req).host;
  } catch {
    return false;
  }
}
