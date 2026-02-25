import { User } from '@privy-io/react-auth';
import { decodeToken } from '@/utils/auth.utils';
import { usePostHog } from 'posthog-js/react';
import { useCallback } from 'react';
import {
  getAuthToken,
  getRefreshToken,
  getRawUserInfoCookie,
  setAuthToken,
  setRefreshToken,
  setUserInfoCookie,
  setAuthLinkedAccountsCookie,
  clearAuthCookies as clearAllAuthCookiesFromUtils,
} from '@/utils/cookie.utils';

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

      setAuthToken(response.accessToken, new Date(accessTokenExpiry.exp * 1000));
      setRefreshToken(response.refreshToken, new Date(refreshTokenExpiry.exp * 1000));
      setUserInfoCookie(response.userInfo, new Date(accessTokenExpiry.exp * 1000));
      setAuthLinkedAccountsCookie(authLinkedAccounts, new Date(refreshTokenExpiry.exp * 1000));

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
    const userInfo = getRawUserInfoCookie();
    const authToken = getAuthToken();
    const refreshToken = getRefreshToken();
    return Boolean(userInfo || authToken || refreshToken);
  }, []);

  /**
   * Gets current user info from cookies
   */
  const getUserInfoFromCookie = useCallback(() => {
    const raw = getRawUserInfoCookie();
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }, []);

  /**
   * Clears auth-related cookies
   */
  const clearAuthCookies = useCallback(() => {
    clearAllAuthCookiesFromUtils();
  }, []);

  return {
    saveTokens,
    isLoggedIn,
    getUserInfoFromCookie,
    clearAuthCookies,
    getLinkedAccounts,
  };
}
