import Cookies from 'js-cookie';
import { z } from 'zod';
import { endSession } from '@/services/session.service';
import {
  isHostOnlySessionCookie,
  SESSION_MARKER_COOKIE,
  SESSION_SCOPE_COOKIE,
  sessionCookieFlags,
  sharedCookieDomain,
} from './sessionCookies';

/**
 * Ends the member's app-scoped sessions in deployed AI Apps (LAB-2695). Fire-and-forget, so sign-out never waits
 * on or fails because of it; `keepalive` lets it finish when the page navigates away right after.
 */
export const revokeAiAppSessions = () => {
  const token = Cookies.get('authToken')?.replace(/"/g, '');
  if (!token || !process.env.DIRECTORY_API_URL || typeof fetch === 'undefined') return;
  try {
    fetch(`${process.env.DIRECTORY_API_URL}/v1/ai-apps/sessions/revoke`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: '{}',
      keepalive: true,
    }).catch(() => undefined);
  } catch {
    // Never let session revocation break sign-out.
  }
};

/**
 * Signs the browser out. The server clears the session cookies, including the httpOnly refresh token that scripts
 * can't remove; await it before reloading or navigating, so the page never loads with the old session.
 */
export const clearAllAuthCookies = async () => {
  revokeAiAppSessions();
  await endSession();
  removeCookie('directory_idToken');
  removeCookie('verified');
  removeCookie('directory_isEmailVerification');
  removeCookie('authToken');
  removeCookie('userInfo');
  removeCookie(SESSION_SCOPE_COOKIE);
  removeCookie(SESSION_MARKER_COOKIE);
  removeCookie('page_params');
  removeCookie('privy-token');
  removeCookie('privy-session');
  removeCookie('authLinkedAccounts');
  removeCookie('lastNotificationCall');
  removeCookie('privy-refresh-token');
  localStorage.clear();
};

export const removeCookie = (name: string) => {
  // Remove cookie without domain (scoped to current subdomain)
  Cookies.remove(name, { path: '/' });

  // Remove cookie with domain (shared across subdomains, if defined)
  if (process.env.COOKIE_DOMAIN) {
    Cookies.remove(name, {
      path: '/',
      domain: process.env.COOKIE_DOMAIN,
    });
  }
};

/** Removes the COOKIE_DOMAIN (shared) copy of a cookie; a host-only cookie with the same name is left alone. */
export const expireSharedCookie = (name: string) => {
  const domain = sharedCookieDomain();
  if (domain) {
    Cookies.remove(name, { path: '/', domain });
  }
};

/** Path and flags for a session cookie written by browser code; the same rule as the proxy's (sessionCookieFlags). */
export const clientSessionCookieAttributes = (): Cookies.CookieAttributes => ({
  path: '/',
  ...(typeof window === 'undefined' ? {} : sessionCookieFlags(window.location)),
});

/**
 * Sets a script-readable LabOS session cookie (authToken, userInfo) with the session flags. userInfo is written
 * host-only and its old shared copy is removed, so deployed AI Apps on sibling subdomains never receive it; authToken
 * stays on COOKIE_DOMAIN while LabOS shares it with apps. `refreshToken` is httpOnly and only the server writes it.
 */
export const setSessionCookie = (name: string, value: string, options: Cookies.CookieAttributes = {}) => {
  if (name === 'refreshToken') {
    throw new Error('refreshToken is httpOnly; only the server sets it');
  }
  const attributes: Cookies.CookieAttributes = { ...options, ...clientSessionCookieAttributes() };
  delete attributes.domain;
  if (isHostOnlySessionCookie(name)) {
    expireSharedCookie(name);
    Cookies.set(name, value, attributes);
    return;
  }
  Cookies.set(name, value, { ...attributes, domain: process.env.COOKIE_DOMAIN || '' });
};

/** True while a LabOS session exists. Reads the script-readable session marker; `refreshToken` is httpOnly. */
export const hasSession = (): boolean => Boolean(Cookies.get(SESSION_MARKER_COOKIE));

/** When the session ends, from the session marker; null when there is no session. */
export const getSessionExpiry = (): Date | null => {
  const exp = Number(Cookies.get(SESSION_MARKER_COOKIE));
  return Number.isFinite(exp) && exp > 0 ? new Date(exp * 1000) : null;
};

export const isLink = (text: string): boolean => {
  const urlSchema = z.string().url();
  try {
    urlSchema.parse(text);
    return true;
  } catch {
    return false;
  }
};

export const getCookiesFromClient = () => {
  const authToken = Cookies.get('authToken')?.replace(/"/g, '');
  return { authToken };
};
