import { useCallback } from 'react';
import { User } from '@privy-io/react-auth';
import { usePathname } from 'next/navigation';
import { toast } from '@/components/core/ToastContainer';
import { EVENTS, TOAST_MESSAGES } from '@/utils/constants';
import { triggerLoader } from '@/utils/common.utils';
import { useAuthAnalytics } from '@/analytics/auth.analytics';
import { getDemoDayState } from '@/services/demo-day/hooks/useGetDemoDayState';
import { deletePrivyUser } from '@/services/auth.service';
import { useAuthTokens } from './useAuthTokens';
import { useAuthActions, getErrorConfig } from '@/contexts/auth';
import Cookies from 'js-cookie';

const DIRECTORY_API_URL = process.env.DIRECTORY_API_URL;

interface DirectoryAuthResult {
  success: boolean;
  error?: string;
}

interface UseDirectoryAuthProps {
  getAccessToken: () => Promise<string | null>;
  logout: () => Promise<void>;
  unlinkEmail: (email: string) => Promise<void>;
  user: User | null;
}

/**
 * Hook for handling directory authentication flow
 */
export function useDirectoryAuth({ getAccessToken, logout, unlinkEmail, user }: UseDirectoryAuthProps) {
  const pathname = usePathname();
  const analytics = useAuthAnalytics();
  const { saveTokens, isLoggedIn } = useAuthTokens();
  const { showError, setLoading } = useAuthActions();

  /**
   * Deletes the Privy user and shows error modal
   */
  const deleteUser = useCallback(
    async (errorCode: string) => {
      analytics.onPrivyUserDelete({ ...user, type: 'init' });
      const token = (await getAccessToken()) as string;
      await deletePrivyUser(token, user?.id as string);
      analytics.onPrivyUserDelete({ type: 'success' });
      await logout();

      if (errorCode) {
        showError(getErrorConfig(errorCode));
      }
    },
    [analytics, getAccessToken, logout, showError, user]
  );

  /**
   * Handles invalid directory email scenarios
   */
  const handleInvalidDirectoryEmail = useCallback(async () => {
    try {
      analytics.onDirectoryLoginFailure({ ...user, type: 'INVALID_DIRECTORY_EMAIL' });

      if (user?.email?.address && user?.linkedAccounts.length > 1) {
        analytics.onPrivyUnlinkEmail({ ...user, type: 'init' });
        await unlinkEmail(user.email.address);
        analytics.onPrivyUnlinkEmail({ type: 'success' });
        await deleteUser('');
      } else if (user?.email?.address && user?.linkedAccounts.length === 1) {
        await deleteUser('');
      } else {
        await logout();
        showError(getErrorConfig(null));
      }
    } catch (error) {
      showError(getErrorConfig(null));
    }
  }, [analytics, deleteUser, logout, showError, unlinkEmail, user]);

  /**
   * Shows success message and triggers notifications after login
   */
  const showLoginSuccess = useCallback(() => {
    toast.success(TOAST_MESSAGES.LOGIN_MSG);
    Cookies.set('showNotificationPopup', JSON.stringify(true));
    document.dispatchEvent(new CustomEvent(EVENTS.GET_NOTIFICATIONS, { detail: { status: true, isShowPopup: false } }));
  }, []);

  /**
   * Handles post-login flow including demo day access check
   */
  const handlePostLogin = useCallback(
    async (userInfo: { uid: string }) => {
      showLoginSuccess();

      // Check demo day access if on demoday page
      if (pathname === '/demoday' && userInfo?.uid) {
        const res = await getDemoDayState(userInfo.uid);
        if (res?.access === 'none') {
          showError(getErrorConfig('rejected_access_level'));
          return false;
        }
      }

      // Reload the page after a delay
      setTimeout(() => {
        window.location.reload();
      }, 500);

      return true;
    },
    [pathname, showError, showLoginSuccess]
  );

  /**
   * Main directory login function - exchanges Privy token for directory tokens
   */
  const initDirectoryLogin = useCallback(async (): Promise<DirectoryAuthResult> => {
    try {
      setLoading(true);
      triggerLoader(true);

      const privyToken = await getAccessToken();
      const response = await fetch(`${DIRECTORY_API_URL}/v1/auth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          exchangeRequestToken: privyToken,
          exchangeRequestId: localStorage.getItem('stateUid'),
          grantType: 'token_exchange',
        }),
      });

      // Handle server errors
      if (response.status === 500 || response.status === 401) {
        triggerLoader(false);
        setLoading(false);
        showError(getErrorConfig('unexpected_error'));
        await logout();
        return { success: false, error: 'unexpected_error' };
      }

      // Handle forbidden errors
      if (response.status === 403) {
        triggerLoader(false);
        setLoading(false);
        showError(getErrorConfig('rejected_access_level'));
        await logout();
        return { success: false, error: 'rejected_access_level' };
      }

      // Handle successful response
      if (response.ok) {
        const result = await response.json();

        if (result?.isDeleteAccount && user) {
          // Handle account deletion scenario
          if (user?.linkedAccounts?.length > 1) {
            await unlinkEmail(user?.email?.address as string);
            await deleteUser('email-changed');
          } else if (user?.email?.address && user?.linkedAccounts.length === 1) {
            await deleteUser('email-changed');
          }
          return { success: false, error: 'email-changed' };
        }

        // Normal successful login
        const formattedResult = structuredClone(result);
        delete formattedResult.userInfo.isFirstTimeLogin;

        saveTokens(formattedResult, user as User);
        await handlePostLogin(result.userInfo);
        analytics.onDirectoryLoginSuccess();

        return { success: true };
      }

      // Handle 403 with email
      if (user?.email?.address && response.status === 403) {
        await handleInvalidDirectoryEmail();
        return { success: false, error: 'invalid_email' };
      }

      return { success: false, error: 'unknown' };
    } catch (error) {
      triggerLoader(false);
      setLoading(false);
      showError(getErrorConfig('unexpected_error'));
      await logout();
      return { success: false, error: 'exception' };
    }
  }, [
    analytics,
    deleteUser,
    getAccessToken,
    handleInvalidDirectoryEmail,
    handlePostLogin,
    logout,
    saveTokens,
    setLoading,
    showError,
    unlinkEmail,
    user,
  ]);

  return {
    initDirectoryLogin,
    deleteUser,
    handleInvalidDirectoryEmail,
    showLoginSuccess,
  };
}
