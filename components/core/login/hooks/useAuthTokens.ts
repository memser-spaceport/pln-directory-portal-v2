import Cookies from 'js-cookie';
import { hasSession } from '@/utils/third-party.helper';
import { endSession, establishSession } from '@/services/session.service';
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
   * Starts the session without requiring a Privy user (e.g. login-token redeem). LabOS's server stores the session
   * cookies (refreshToken httpOnly); throws when it refuses the tokens, so the caller shows its sign-in error.
   */
  const saveSessionTokens = useCallback(
    async (response: TokenResponse, linkedAccounts = '') => {
      const refreshTokenExpiry = decodeToken(response.refreshToken);

      localStorage.removeItem('stateUid');

      const established = await establishSession({
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
        userInfo: response.userInfo,
      });
      if (!established) {
        throw new Error('Session could not be started');
      }

      Cookies.set('authLinkedAccounts', JSON.stringify(linkedAccounts), {
        expires: new Date(refreshTokenExpiry.exp * 1000),
        path: '/',
        domain: COOKIE_DOMAIN,
      });

      postHog.identify(response.userInfo.uid, {
        email: response.userInfo.email,
        name: response.userInfo.name,
        uid: response.userInfo.uid,
      });
    },
    [postHog],
  );

  /**
   * Saves tokens and user info to cookies after successful authentication
   */
  const saveTokens = useCallback(
    (response: TokenResponse, user: User) => saveSessionTokens(response, getLinkedAccounts(user)),
    [saveSessionTokens],
  );

  /**
   * Checks if user is currently logged in based on cookies
   */
  const isLoggedIn = useCallback((): boolean => {
    const userInfo = Cookies.get('userInfo');
    const accessToken = Cookies.get('accessToken');
    return Boolean(userInfo || accessToken || hasSession());
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
   * Clears auth-related cookies; the httpOnly refresh token is cleared by the server
   */
  const clearAuthCookies = useCallback(async () => {
    await endSession();
    Cookies.remove('authLinkedAccounts');
    Cookies.remove('authToken');
    Cookies.remove('userInfo');
  }, []);

  return {
    saveTokens,
    saveSessionTokens,
    isLoggedIn,
    getUserInfoFromCookie,
    clearAuthCookies,
    getLinkedAccounts,
  };
}
