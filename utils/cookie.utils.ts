import Cookies from 'js-cookie';
import { getParsedValue } from './common.utils';

// --- Cookie Name Constants (used by both client + server code) ---
const PREFIX = process.env.COOKIE_PREFIX || '';

export const AUTH_COOKIE_NAMES = {
  authToken: `${PREFIX}authToken`,
  refreshToken: `${PREFIX}refreshToken`,
  userInfo: `${PREFIX}userInfo`,
  authLinkedAccounts: `${PREFIX}authLinkedAccounts`,
} as const;

// --- Domain helper ---
const COOKIE_DOMAIN = process.env.COOKIE_DOMAIN || undefined;

function defaultOptions(expires?: Date): Cookies.CookieAttributes {
  return { expires, path: '/', domain: COOKIE_DOMAIN };
}

// --- Client-side getters ---
export function getAuthToken(): string | undefined {
  const raw = Cookies.get(AUTH_COOKIE_NAMES.authToken);
  return raw ? getParsedValue(raw) : undefined;
}

export function getRefreshToken(): string | undefined {
  const raw = Cookies.get(AUTH_COOKIE_NAMES.refreshToken);
  return raw ? getParsedValue(raw) : undefined;
}

export function getUserInfo(): any | null {
  try {
    const raw = Cookies.get(AUTH_COOKIE_NAMES.userInfo);
    return raw ? getParsedValue(raw) : null;
  } catch {
    return null;
  }
}

export function getRawUserInfoCookie(): string | undefined {
  return Cookies.get(AUTH_COOKIE_NAMES.userInfo);
}

export function getAuthLinkedAccounts(): string | undefined {
  return Cookies.get(AUTH_COOKIE_NAMES.authLinkedAccounts);
}

// --- Client-side setters ---
export function setAuthToken(token: string, expires: Date) {
  Cookies.set(AUTH_COOKIE_NAMES.authToken, JSON.stringify(token), defaultOptions(expires));
}

export function setRefreshToken(token: string, expires: Date) {
  Cookies.set(AUTH_COOKIE_NAMES.refreshToken, JSON.stringify(token), defaultOptions(expires));
}

export function setUserInfoCookie(userInfo: any, expires: Date) {
  Cookies.set(AUTH_COOKIE_NAMES.userInfo, JSON.stringify(userInfo), defaultOptions(expires));
}

export function setAuthLinkedAccountsCookie(accounts: string, expires: Date) {
  Cookies.set(AUTH_COOKIE_NAMES.authLinkedAccounts, JSON.stringify(accounts), defaultOptions(expires));
}

// Convenience: update userInfo cookie in-place (preserves existing expiry via path-only set)
export function updateUserInfoCookie(userInfo: any) {
  Cookies.set(AUTH_COOKIE_NAMES.userInfo, JSON.stringify(userInfo), { path: '/' });
}

// --- Client-side removers ---
export function removeAuthCookie(name: string) {
  Cookies.remove(name, { path: '/' });
  if (COOKIE_DOMAIN) {
    Cookies.remove(name, { path: '/', domain: COOKIE_DOMAIN });
  }
}

export function clearAuthCookies() {
  removeAuthCookie(AUTH_COOKIE_NAMES.authToken);
  removeAuthCookie(AUTH_COOKIE_NAMES.refreshToken);
  removeAuthCookie(AUTH_COOKIE_NAMES.userInfo);
  removeAuthCookie(AUTH_COOKIE_NAMES.authLinkedAccounts);
}
