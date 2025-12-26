'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { usePostHog } from 'posthog-js/react';

import { renewAccessToken } from '@/services/auth.service';
import { clearAllAuthCookies } from '@/utils/third-party.helper';
import { authEvents } from '@/components/core/login/utils';
import { broadcastLogout } from '../BroadcastChannel';
import { SessionExpiredModal } from '../modals/SessionExpiredModal';
import { IUserInfo } from '@/types/shared.types';
import { decodeToken } from '@/utils/auth.utils';

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

  const handleLogout = useCallback(() => {
    clearAllAuthCookies();
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

    const refreshToken = Cookies.get('refreshToken');
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
    const hasTokens = refreshToken || authToken || authTokenFromCookie;

    // Case 1: We have tokens but no valid userInfo (invalid state - try to restore)
    if (hasTokens && !hasValidUserInfo && refreshToken) {
      setIsValidating(true);

      // Try to restore userInfo by refreshing the token
      const attemptRestore = async () => {
        try {
          const refreshTokenValue = refreshToken.replace(/"/g, '');
          const renewResponse = await renewAccessToken(refreshTokenValue);

          if (renewResponse.ok && renewResponse.data) {
            const { accessToken, refreshToken: newRefreshToken, userInfo: newUserInfo } = renewResponse.data;

            if (accessToken && newRefreshToken && newUserInfo && newUserInfo.uid) {
              // Restore cookies
              const accessTokenExpiry = decodeToken(accessToken) as any;
              const refreshTokenExpiry = decodeToken(newRefreshToken) as any;

              Cookies.set('refreshToken', JSON.stringify(newRefreshToken), {
                expires: new Date(refreshTokenExpiry.exp * 1000),
                domain: process.env.COOKIE_DOMAIN,
                path: '/',
              });
              Cookies.set('authToken', JSON.stringify(accessToken), {
                expires: new Date(accessTokenExpiry.exp * 1000),
                domain: process.env.COOKIE_DOMAIN,
                path: '/',
              });
              Cookies.set('userInfo', JSON.stringify(newUserInfo), {
                expires: new Date(accessTokenExpiry.exp * 1000),
                domain: process.env.COOKIE_DOMAIN,
                path: '/',
              });

              // Refresh the page to reload with valid userInfo
              router.refresh();
              return;
            }
          }

          // If refresh failed, show session expired modal
          setShowSessionExpired(true);
          // Clear cookies after showing modal
          clearAllAuthCookies();
        } catch (error) {
          console.error('Failed to restore userInfo:', error);
          setShowSessionExpired(true);
          clearAllAuthCookies();
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
