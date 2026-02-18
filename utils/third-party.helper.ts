import Cookies from 'js-cookie';
import { z } from 'zod';
import { clearAuthCookies, removeAuthCookie, getAuthToken, getRefreshToken, getUserInfo as getCookieUserInfo } from './cookie.utils';

export const clearAllAuthCookies = () => {
  removeCookie('directory_idToken');
  removeCookie('verified');
  removeCookie('directory_isEmailVerification');
  removeCookie('page_params');
  removeCookie('privy-token');
  removeCookie('privy-session');
  removeCookie('lastNotificationCall');
  removeCookie('privy-refresh-token');
  clearAuthCookies();
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

export const getUserInfo = () => {
  try {
    if (typeof window !== 'undefined') {
      return getCookieUserInfo();
    }
    return undefined;
  } catch (e) {
    console.error(e);
    return null;
  }
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
  const authToken = getAuthToken();
  const refreshToken = getRefreshToken();
  const userInfo = getUserInfo();
  return { authToken, refreshToken, userInfo };
};
