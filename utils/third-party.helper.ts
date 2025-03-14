import Cookies from 'js-cookie';
import { getParsedValue } from './common.utils';
import { z } from 'zod';

export const clearAllAuthCookies = () => {
  Cookies.remove('directory_idToken');
  Cookies.remove('verified', { path: '/', domain: process.env.COOKIE_DOMAIN || '' });
  Cookies.remove('directory_isEmailVerification');
  Cookies.remove(`${process.env.COOKIE_PREFIX}-authToken`, { path: '/', domain: process.env.COOKIE_DOMAIN || '' });
  Cookies.remove(`${process.env.COOKIE_PREFIX}-refreshToken`, { path: '/', domain: process.env.COOKIE_DOMAIN || '' });
  Cookies.remove(`${process.env.COOKIE_PREFIX}-userInfo`, { path: '/', domain: process.env.COOKIE_DOMAIN || '' });
  Cookies.remove('page_params', { path: '/', domain: process.env.COOKIE_DOMAIN || '' });
  Cookies.remove('privy-token');
  Cookies.remove('privy-session');
  Cookies.remove(`${process.env.COOKIE_PREFIX}-authLinkedAccounts`);
  Cookies.remove('lastNotificationCall');
  Cookies.remove('privy-refresh-token');
  localStorage.clear();
};

export const getUserInfo = () => {
  try {
    let userInfo;
    if (typeof window !== 'undefined') {
      const rawUserInfo = Cookies.get(`${process.env.COOKIE_PREFIX}-userInfo`);
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
  const authToken = Cookies.get(`${process.env.COOKIE_PREFIX}-authToken`)?.replace(/"/g, '');
  const refreshToken = Cookies.get(`${process.env.COOKIE_PREFIX}-refreshToken`)?.replace(/"/g, '');
  const userInfo = getUserInfo();
  return { authToken, refreshToken, userInfo };
}