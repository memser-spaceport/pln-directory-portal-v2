import Cookies from 'js-cookie';
import { User } from '@privy-io/react-auth';
import { decodeToken } from '@/utils/auth.utils';
import { usePostHog } from 'posthog-js/react';
import { useCallback } from 'react';

interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  userInfo: {
    uid: string;
    email?: string;
    name?: string;
    isFirstTimeLogin?: boolean;
  };
}

const COOKIE_DOMAIN = process.env.COOKIE_DOMAIN || '';

/**
 * Maps Privy linked account types to our internal account type names
 */
function mapAccountType(type: string): string {
  const typeMap: Record<string, string> = {
    wallet: 'siwe',
    google_oauth: 'google',
    github_oauth: 'github',
  };
  return typeMap[type] || '';
}

/**
 * Extracts and formats linked accounts from a Privy user object
 */
export function getLinkedAccounts(user: User): string {
  const linkedAccounts = user?.linkedAccounts ?? [];
  return linkedAccounts
    .map((account: any) => mapAccountType(account?.type))
    .filter(Boolean)
    .join(',');
}

/**
 * Hook for managing auth tokens and cookies
 */
export function useAuthTokens() {
  const postHog = usePostHog();

  /**
   * Saves tokens and user info to cookies after successful authentication
   */
  const saveTokens = useCallback(
    (response: TokenResponse, user: User) => {
      const authLinkedAccounts = getLinkedAccounts(user);
      const accessTokenExpiry = decodeToken(response.accessToken);
      const refreshTokenExpiry = decodeToken(response.refreshToken);

      // Clear stateUid from localStorage
      localStorage.removeItem('stateUid');

      // Set auth token cookie
      Cookies.set('authToken', JSON.stringify(response.accessToken), {
        expires: new Date(accessTokenExpiry.exp * 1000),
        domain: COOKIE_DOMAIN,
      });

      // Set refresh token cookie
      Cookies.set('refreshToken', JSON.stringify(response.refreshToken), {
        expires: new Date(refreshTokenExpiry.exp * 1000),
        path: '/',
        domain: COOKIE_DOMAIN,
      });

      // Set user info cookie
      Cookies.set('userInfo', JSON.stringify(response.userInfo), {
        expires: new Date(accessTokenExpiry.exp * 1000),
        path: '/',
        domain: COOKIE_DOMAIN,
      });

      // Set linked accounts cookie
      Cookies.set('authLinkedAccounts', JSON.stringify(authLinkedAccounts), {
        expires: new Date(refreshTokenExpiry.exp * 1000),
        path: '/',
        domain: COOKIE_DOMAIN,
      });

      // Identify user in PostHog
      postHog.identify(response.userInfo.uid, {
        email: response.userInfo.email,
        name: response.userInfo.name,
        uid: response.userInfo.uid,
      });
    },
    [postHog]
  );

  /**
   * Checks if user is currently logged in based on cookies
   */
  const isLoggedIn = useCallback((): boolean => {
    const userInfo = Cookies.get('userInfo');
    const accessToken = Cookies.get('accessToken');
    const refreshToken = Cookies.get('refreshToken');
    return Boolean(userInfo || accessToken || refreshToken);
  }, []);

  /**
   * Gets current user info from cookies
   */
  const getUserInfoFromCookie = useCallback(() => {
    const userInfo = Cookies.get('userInfo');
    if (!userInfo) return null;
    try {
      return JSON.parse(userInfo);
    } catch {
      return null;
    }
  }, []);

  /**
   * Clears auth-related cookies
   */
  const clearAuthCookies = useCallback(() => {
    Cookies.remove('authLinkedAccounts');
    Cookies.remove('authToken');
    Cookies.remove('refreshToken');
    Cookies.remove('userInfo');
  }, []);

  return {
    saveTokens,
    isLoggedIn,
    getUserInfoFromCookie,
    clearAuthCookies,
    getLinkedAccounts,
  };
}
