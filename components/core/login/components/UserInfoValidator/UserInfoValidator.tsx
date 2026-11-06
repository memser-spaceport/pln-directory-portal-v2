'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { usePostHog } from 'posthog-js/react';

import { refreshSession } from '@/services/session.service';
import { clearAllAuthCookies, hasSession } from '@/utils/third-party.helper';
import { authEvents } from '@/components/core/login/utils';
import { broadcastLogout } from '../BroadcastChannel';
import { SessionExpiredModal } from '../modals/SessionExpiredModal';
import { IUserInfo } from '@/types/shared.types';

interface UserInfoValidatorProps {
  userInfo: IUserInfo | null | undefined;
  isLoggedIn: boolean;
  authToken: string | null | undefined;
}

/**
 * UserInfoValidator - Validates and restores userInfo when missing
 *
 * This component:
 * 1. Checks if userInfo is missing but authToken exists (invalid state)
 * 2. Attempts to restore userInfo by refreshing the token
 * 3. If refresh fails, shows session expired modal and logs out
 * 4. Prevents showing logged-in UI without valid userInfo
 */
export function UserInfoValidator({ userInfo, isLoggedIn, authToken }: UserInfoValidatorProps) {
  const router = useRouter();
  const postHog = usePostHog();
  const [showSessionExpired, setShowSessionExpired] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  const handleLogout = useCallback(async () => {
    await clearAllAuthCookies();
    authEvents.emit('auth:logout');
    broadcastLogout();
    postHog.reset();
    setShowSessionExpired(false);
    router.refresh();
  }, [postHog, router]);

  const handleLogin = useCallback(() => {
    setShowSessionExpired(false);
  }, []);

  useEffect(() => {
    // Skip if already validating
    if (isValidating) {
      return;
    }

    const sessionExists = hasSession();
    const authTokenFromCookie = Cookies.get('authToken');
    const userInfoFromCookie = Cookies.get('userInfo');

    // Parse userInfo from cookie to check if it's valid
    let parsedUserInfo: IUserInfo | null = null;
    try {
      if (userInfoFromCookie) {
        parsedUserInfo = JSON.parse(userInfoFromCookie);
      }
    } catch (e) {
      // Invalid JSON, treat as missing
    }

    const hasValidUserInfo = (userInfo?.uid || parsedUserInfo?.uid) && (userInfo || parsedUserInfo);
    const hasTokens = sessionExists || authToken || authTokenFromCookie;

    // Case 1: We have tokens but no valid userInfo (invalid state - try to restore)
    if (hasTokens && !hasValidUserInfo && sessionExists) {
      setIsValidating(true);

      // Try to restore userInfo by refreshing the session (the server rewrites the cookies)
      const attemptRestore = async () => {
        try {
          const session = await refreshSession();
          if (session?.userInfo?.uid) {
            // Refresh the page to reload with valid userInfo
            router.refresh();
            return;
          }

          // If refresh failed, show session expired modal
          setShowSessionExpired(true);
          // Clear cookies after showing modal
          await clearAllAuthCookies();
        } catch (error) {
          console.error('Failed to restore userInfo:', error);
          setShowSessionExpired(true);
          await clearAllAuthCookies();
        } finally {
          setIsValidating(false);
        }
      };

      attemptRestore();
    }
    // Case 2: No tokens and no userInfo - ensure we're logged out
    else if (!hasTokens && !hasValidUserInfo && isLoggedIn) {
      // Inconsistent state - clear everything
      handleLogout();
    }
  }, [userInfo, isLoggedIn, authToken, isValidating, showSessionExpired, router, handleLogout]);

  // Prevent navigation to /members/undefined
  useEffect(() => {
    const handleRouteChange = (url: string) => {
      if (url.includes('/members/undefined')) {
        router.replace('/home');
        return;
      }
    };

    // Check current URL
    if (typeof window !== 'undefined') {
      if (window.location.pathname.includes('/members/undefined')) {
        router.replace('/home');
      }
    }
  }, [router]);

  return <SessionExpiredModal open={showSessionExpired} onClose={handleLogout} onLogin={handleLogin} />;
}
