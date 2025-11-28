'use client';

import { useEffect, useState, useCallback } from 'react';
import { useToggle } from 'react-use';
import { User } from '@privy-io/react-auth';
import { usePathname, useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

import usePrivyWrapper from '@/hooks/auth/usePrivyWrapper';
import { useAuthTokens, getLinkedAccounts } from '@/hooks/auth/useAuthTokens';
import { useAuthAnalytics } from '@/analytics/auth.analytics';
import { deletePrivyUser } from '@/services/auth.service';
import { triggerLoader } from '@/utils/common.utils';
import { toast } from '@/components/core/ToastContainer';
import { EVENTS, TOAST_MESSAGES } from '@/utils/constants';
import { getDemoDayState } from '@/services/demo-day/hooks/useGetDemoDayState';
import { createLogoutChannel } from '../BroadcastChannel';
import { LinkAccountModal } from '../LinkAccountModal';

import './PrivyModals.scss';

// Account linking methods mapped to their handler functions
type LinkMethod = 'github' | 'google' | 'siwe' | 'email' | 'updateEmail';

/**
 * PrivyModals - Handles authentication events and modals
 *
 * This component listens for Privy authentication events and handles:
 * - Login success/error
 * - Account linking success/error
 * - Logout flow
 * - Directory token exchange
 */
export function PrivyModals() {
  const router = useRouter();
  const pathname = usePathname();
  const analytics = useAuthAnalytics();

  // Privy hooks
  const {
    getAccessToken,
    linkEmail,
    linkGithub,
    linkGoogle,
    linkWallet,
    login,
    logout,
    ready,
    unlinkEmail,
    updateEmail,
    user,
    PRIVY_CUSTOM_EVENTS,
  } = usePrivyWrapper();

  // Custom hooks
  const { saveTokens } = useAuthTokens();

  // Local state
  const [linkAccountKey, setLinkAccountKey] = useState<LinkMethod | ''>('');
  const [linkAccountModalOpen, toggleLinkAccountModalOpen] = useToggle(false);

  // ============================================
  // URL Utilities
  // ============================================

  const clearPrivyParams = useCallback(() => {
    const params = new URLSearchParams(window.location.search);
    const cleanParams = new URLSearchParams();

    params.forEach((value, key) => {
      if (!key.includes('privy_')) {
        cleanParams.set(key, value);
      }
    });

    const queryString = cleanParams.toString();
    router.push(`${window.location.pathname}${queryString ? `?${queryString}` : ''}`);
  }, [router]);

  // ============================================
  // User Management
  // ============================================

  const deleteUser = useCallback(
    async (errorCode: string) => {
      analytics.onPrivyUserDelete({ ...user, type: 'init' });
      const token = (await getAccessToken()) as string;
      await deletePrivyUser(token, user?.id as string);
      analytics.onPrivyUserDelete({ type: 'success' });
      setLinkAccountKey('');
      await logout();
      document.dispatchEvent(new CustomEvent('auth-invalid-email', { detail: errorCode }));
    },
    [analytics, getAccessToken, logout, user]
  );

  const handleInvalidDirectoryEmail = useCallback(async () => {
    try {
      analytics.onDirectoryLoginFailure({ ...user, type: 'INVALID_DIRECTORY_EMAIL' });

      if (user?.email?.address && user?.linkedAccounts.length > 1) {
        analytics.onPrivyUnlinkEmail({ ...user, type: 'init' });
        await unlinkEmail(user.email.address);
        analytics.onPrivyUnlinkEmail({ type: 'success' });
        await deleteUser('');
      } else if (user?.email?.address && user?.linkedAccounts.length === 1) {
        setLinkAccountKey('');
        await deleteUser('');
      } else {
        await logout();
        document.dispatchEvent(new CustomEvent('auth-invalid-email'));
      }
    } catch {
      document.dispatchEvent(new CustomEvent('auth-invalid-email'));
    }
  }, [analytics, deleteUser, logout, unlinkEmail, user]);

  // ============================================
  // Login Flow
  // ============================================

  const showLoginSuccess = useCallback(() => {
    setLinkAccountKey('');
    toast.success(TOAST_MESSAGES.LOGIN_MSG);
    Cookies.set('showNotificationPopup', JSON.stringify(true));
    document.dispatchEvent(
      new CustomEvent(EVENTS.GET_NOTIFICATIONS, { detail: { status: true, isShowPopup: false } })
    );
  }, []);

  const loginUser = useCallback(
    async (output: { userInfo: { uid: string } }) => {
      clearPrivyParams();
      showLoginSuccess();

      // Check demo day access
      if (pathname === '/demoday' && output?.userInfo?.uid) {
        const res = await getDemoDayState(output.userInfo.uid);
        if (res?.access === 'none') {
          document.dispatchEvent(new CustomEvent('auth-invalid-email', { detail: 'rejected_access_level' }));
          return;
        }
      }

      setTimeout(() => window.location.reload(), 500);
    },
    [clearPrivyParams, pathname, showLoginSuccess]
  );

  const initDirectoryLogin = useCallback(async () => {
    try {
      triggerLoader(true);
      const privyToken = await getAccessToken();

      const response = await fetch(`${process.env.DIRECTORY_API_URL}/v1/auth/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exchangeRequestToken: privyToken,
          exchangeRequestId: localStorage.getItem('stateUid'),
          grantType: 'token_exchange',
        }),
      });

      // Handle errors
      if (response.status === 500 || response.status === 401) {
        triggerLoader(false);
        document.dispatchEvent(new CustomEvent('auth-invalid-email', { detail: 'unexpected_error' }));
        setLinkAccountKey('');
        await logout();
        return;
      }

      if (response.status === 403) {
        triggerLoader(false);
        document.dispatchEvent(new CustomEvent('auth-invalid-email', { detail: 'rejected_access_level' }));
        setLinkAccountKey('');
        await logout();
        return;
      }

      // Handle success
      if (response.ok) {
        const result = await response.json();

        if (result?.isDeleteAccount && user) {
          if (user?.linkedAccounts?.length > 1) {
            await unlinkEmail(user?.email?.address as string);
            await deleteUser('email-changed');
          } else if (user?.email?.address && user?.linkedAccounts.length === 1) {
            setLinkAccountKey('');
            await deleteUser('email-changed');
          }
          return;
        }

        // Normal login success
        const formattedResult = structuredClone(result);
        delete formattedResult.userInfo.isFirstTimeLogin;

        saveTokens(formattedResult, user as User);
        await loginUser(result);
        analytics.onDirectoryLoginSuccess();
      }

      // Handle 403 with email
      if (user?.email?.address && response.status === 403) {
        await handleInvalidDirectoryEmail();
      }
    } catch {
      triggerLoader(false);
      document.dispatchEvent(new CustomEvent('auth-invalid-email', { detail: 'unexpected_error' }));
      setLinkAccountKey('');
      await logout();
    }
  }, [
    analytics,
    deleteUser,
    getAccessToken,
    handleInvalidDirectoryEmail,
    loginUser,
    logout,
    saveTokens,
    unlinkEmail,
    user,
  ]);

  // ============================================
  // Event Handlers
  // ============================================

  useEffect(() => {
    // Login success handler
    async function handleLoginSuccess(e: CustomEvent) {
      const { user: privyUser } = e.detail;
      analytics.onPrivyLoginSuccess(privyUser);

      // Require email linking if not present
      if (!privyUser?.email?.address) {
        setLinkAccountKey('email');
        return;
      }

      const stateUid = localStorage.getItem('stateUid');
      if (stateUid) {
        analytics.onDirectoryLoginInit({ ...privyUser, stateUid });
        await initDirectoryLogin();
      }
    }

    // Account link success handler
    async function handleLinkSuccess(e: CustomEvent) {
      const { linkMethod, linkedAccount, user: privyUser } = e.detail;
      const authLinkedAccounts = getLinkedAccounts(privyUser);

      analytics.onPrivyLinkSuccess({ linkMethod, linkedAccount, authLinkedAccounts });

      if (linkMethod === 'email') {
        const isLoggedIn = Cookies.get('userInfo') || Cookies.get('accessToken') || Cookies.get('refreshToken');

        if (!isLoggedIn) {
          const stateUid = localStorage.getItem('stateUid');
          analytics.onDirectoryLoginInit({ ...privyUser, stateUid, linkedAccount });
          await initDirectoryLogin();
        } else {
          triggerLoader(true);
          document.dispatchEvent(
            new CustomEvent('directory-update-email', { detail: { newEmail: linkedAccount.address } })
          );
        }
      } else {
        // Handle social account linking
        document.dispatchEvent(new CustomEvent('new-auth-accounts', { detail: authLinkedAccounts }));

        const successMessages: Record<string, string> = {
          github: 'Github linked successfully',
          google: 'Google linked successfully',
          siwe: 'Wallet linked successfully',
        };

        if (successMessages[linkMethod]) {
          toast.success(successMessages[linkMethod]);
        }
      }

      setLinkAccountKey('');
    }

    // Login error handler
    function handleLoginError(e: CustomEvent) {
      analytics.onPrivyLoginFailure(e.detail);
      triggerLoader(false);

      if (e.detail.error === 'linked_to_another_user') {
        logout();
        toggleLinkAccountModalOpen();
      }
    }

    // Link error handler
    async function handleLinkError(e: CustomEvent) {
      const isLoggedIn = Cookies.get('userInfo') || Cookies.get('accessToken') || Cookies.get('refreshToken');
      const error = e.detail?.error;

      if (!isLoggedIn) {
        analytics.onAccountLinkError({ type: 'loggedout', error });

        const recoverableErrors = ['linked_to_another_user', 'exited_link_flow', 'invalid_credentials'];

        if (recoverableErrors.includes(error)) {
          try {
            await deleteUser(error);
          } catch {
            triggerLoader(false);
            document.dispatchEvent(new CustomEvent('auth-invalid-email', { detail: error }));
          }
        } else {
          await logout();
          setLinkAccountKey('');
          triggerLoader(false);
          document.dispatchEvent(new CustomEvent('auth-invalid-email', { detail: 'unexpected_error' }));
        }
      } else {
        analytics.onAccountLinkError({ type: 'loggedin', error });
      }
    }

    // Init login handler
    function handleInitLogin() {
      const stateUid = localStorage.getItem('stateUid');
      const prefillEmail = localStorage.getItem('prefillEmail');

      if (stateUid) {
        login(
          prefillEmail
            ? { prefill: { type: 'email', value: prefillEmail }, loginMethods: ['email'] }
            : undefined
        );
      }
    }

    // Add account handler
    function handleAddAccount(e: CustomEvent) {
      analytics.onPrivyAccountLink({ account: e.detail });
      setLinkAccountKey(e.detail);
    }

    // Logout handler
    async function handleLogout() {
      Cookies.remove('authLinkedAccounts');
      await logout();
    }

    // Logout success handler
    function handleLogoutSuccess() {
      const isDirectory = localStorage.getItem('directory-logout');
      if (isDirectory) {
        localStorage.clear();
        toast.info(TOAST_MESSAGES.LOGOUT_MSG);
        createLogoutChannel().postMessage('logout');
      }
    }

    // Register event listeners
    const events = [
      ['privy-init-login', handleInitLogin],
      ['auth-link-account', handleAddAccount],
      ['init-privy-logout', handleLogout],
      [PRIVY_CUSTOM_EVENTS.AUTH_LOGIN_SUCCESS, handleLoginSuccess],
      [PRIVY_CUSTOM_EVENTS.AUTH_LINK_ACCOUNT_SUCCESS, handleLinkSuccess],
      [PRIVY_CUSTOM_EVENTS.AUTH_LOGIN_ERROR, handleLoginError],
      [PRIVY_CUSTOM_EVENTS.AUTH_LINK_ERROR, handleLinkError],
      ['privy-logout-success', handleLogoutSuccess],
    ] as const;

    events.forEach(([event, handler]) => {
      document.addEventListener(event, handler as EventListener);
    });

    return () => {
      events.forEach(([event, handler]) => {
        document.removeEventListener(event, handler as EventListener);
      });
    };
  }, [
    PRIVY_CUSTOM_EVENTS,
    analytics,
    deleteUser,
    initDirectoryLogin,
    login,
    logout,
    ready,
    toggleLinkAccountModalOpen,
    user,
  ]);

  // ============================================
  // Account Linking Effect
  // ============================================

  useEffect(() => {
    if (!linkAccountKey) return;

    const linkMethods: Record<LinkMethod, () => void> = {
      github: linkGithub,
      google: linkGoogle,
      siwe: linkWallet,
      email: linkEmail,
      updateEmail: updateEmail,
    };

    const method = linkMethods[linkAccountKey as LinkMethod];
    if (method) {
      method();
      setLinkAccountKey('');
    }
  }, [linkAccountKey, linkEmail, linkGithub, linkGoogle, linkWallet, updateEmail]);

  // ============================================
  // Render
  // ============================================

  return <LinkAccountModal open={linkAccountModalOpen} toggleOpen={toggleLinkAccountModalOpen} />;
}
