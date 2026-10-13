import Cookies from 'js-cookie';
import { z } from 'zod';
import { isHostOnlySessionCookie, SESSION_SCOPE_COOKIE, sharedCookieDomain } from './sessionCookies';

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

export const clearAllAuthCookies = () => {
  revokeAiAppSessions();
  removeCookie('directory_idToken');
  removeCookie('verified');
  removeCookie('directory_isEmailVerification');
  removeCookie('authToken');
  removeCookie('refreshToken');
  removeCookie('userInfo');
  removeCookie(SESSION_SCOPE_COOKIE);
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

/**
 * Sets a LabOS session cookie. refreshToken/userInfo are written host-only and their old shared copy is removed, so
 * deployed AI Apps on sibling subdomains never receive them; authToken stays on COOKIE_DOMAIN, where apps read it.
 */
export const setSessionCookie = (name: string, value: string, options: Cookies.CookieAttributes = {}) => {
  const attributes: Cookies.CookieAttributes = { path: '/', ...options };
  delete attributes.domain;
  if (isHostOnlySessionCookie(name)) {
    expireSharedCookie(name);
    Cookies.set(name, value, attributes);
    return;
  }
  Cookies.set(name, value, { ...attributes, domain: process.env.COOKIE_DOMAIN || '' });
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
  const refreshToken = Cookies.get('refreshToken')?.replace(/"/g, '');
  return { authToken, refreshToken };
};
