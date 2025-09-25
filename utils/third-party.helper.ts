import Cookies from 'js-cookie';
import { getParsedValue } from './common.utils';
import { z } from 'zod';

export const clearAllAuthCookies = () => {
  removeCookie('directory_idToken');
  removeCookie('verified');
  removeCookie('directory_isEmailVerification');
  removeCookie('authToken');
  removeCookie('refreshToken');
  removeCookie('userInfo');
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

export const getUserInfo = () => {
  try {
    let userInfo;
    if (typeof window !== 'undefined') {
      const rawUserInfo = Cookies.get('userInfo');
      if (rawUserInfo) {
        userInfo = getParsedValue(rawUserInfo);
      }
    }
    return userInfo;
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
  const authToken = Cookies.get('authToken')?.replace(/"/g, '');
  const refreshToken = Cookies.get('refreshToken')?.replace(/"/g, '');
  const userInfo = getUserInfo();
  return { authToken, refreshToken, userInfo };
};
