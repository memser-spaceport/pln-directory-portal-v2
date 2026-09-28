import Cookies from 'js-cookie';
import { z } from 'zod';
import { isHostOnlySessionCookie, SESSION_SCOPE_COOKIE } from './sessionCookies';

export const clearAllAuthCookies = () => {
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
  if (process.env.COOKIE_DOMAIN) {
    Cookies.remove(name, { path: '/', domain: process.env.COOKIE_DOMAIN });
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
