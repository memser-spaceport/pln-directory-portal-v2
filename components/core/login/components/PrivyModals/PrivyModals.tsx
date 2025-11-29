'use client';

import { useEffect, useState, useCallback } from 'react';
import { useToggle } from 'react-use';
import { User } from '@privy-io/react-auth';
import { usePathname, useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

import { usePrivyWrapper, useAuthTokens, getLinkedAccounts } from '../../hooks';
import { useAuthAnalytics } from '@/analytics/auth.analytics';
import { deletePrivyUser, exchangeToken } from '@/services/auth.service';
import { triggerLoader } from '@/utils/common.utils';
import { toast } from '@/components/core/ToastContainer';
import { EVENTS, TOAST_MESSAGES } from '@/utils/constants';
import { getDemoDayState } from '@/services/demo-day/hooks/useGetDemoDayState';
import { broadcastLogout } from '../BroadcastChannel';
import { LinkAccountModal } from '../errors/LinkAccountModal';
import { authStatus, authEvents, AuthErrorCode, LinkMethod } from '../../utils';

import './PrivyModals.scss';

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
    async (errorCode: AuthErrorCode) => {
      analytics.onPrivyUserDelete({ ...user, type: 'init' });
      const token = (await getAccessToken()) as string;
      await deletePrivyUser(token, user?.id as string);
      analytics.onPrivyUserDelete({ type: 'success' });
      setLinkAccountKey('');
      await logout();
      authEvents.emit('auth:invalid-email', errorCode);
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
        authEvents.emit('auth:invalid-email', '');
      }
    } catch {
      authEvents.emit('auth:invalid-email', '');
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
          authEvents.emit('auth:invalid-email', 'rejected_access_level');
          return;
        }
      }

      // Use router.refresh() instead of hard reload for better UX
      router.refresh();
      // Small delay to ensure cookies are set before refresh completes
      setTimeout(() => window.location.reload(), 300);
    },
    [clearPrivyParams, pathname, router, showLoginSuccess]
  );

  const initDirectoryLogin = useCallback(async () => {
    try {
      triggerLoader(true);
      const privyToken = await getAccessToken();
      const stateUid = localStorage.getItem('stateUid') || '';

      // Use centralized token exchange with retry support
      const response = await exchangeToken(privyToken as string, stateUid);

      // Handle errors
      if (response.status === 500 || response.status === 401) {
        triggerLoader(false);
        authEvents.emit('auth:invalid-email', 'unexpected_error');
        setLinkAccountKey('');
        await logout();
        return;
      }

      if (response.status === 403) {
        triggerLoader(false);
        authEvents.emit('auth:invalid-email', 'rejected_access_level');
        setLinkAccountKey('');
        await logout();
        return;
      }

      // Handle success
      if (response.ok && response.data) {
        const result = response.data;

        if (result.isDeleteAccount && user) {
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
      authEvents.emit('auth:invalid-email', 'unexpected_error');
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
    async function handleLoginSuccess(data: { user: any }) {
      const privyUser = data.user;
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
    async function handleLinkSuccess(data: { user: any; linkMethod: string; linkedAccount: any }) {
      const { linkMethod, linkedAccount, user: privyUser } = data;
      const authLinkedAccounts = getLinkedAccounts(privyUser);

      analytics.onPrivyLinkSuccess({ linkMethod, linkedAccount, authLinkedAccounts });

      if (linkMethod === 'email') {
        const isLoggedIn = authStatus.isLoggedIn();

        if (!isLoggedIn) {
          const stateUid = localStorage.getItem('stateUid');
          analytics.onDirectoryLoginInit({ ...privyUser, stateUid, linkedAccount });
          await initDirectoryLogin();
        } else {
          triggerLoader(true);
          authEvents.emit('auth:update-email', { newEmail: linkedAccount.address });
        }
      } else {
        // Handle social account linking
        authEvents.emit('auth:new-accounts', authLinkedAccounts);

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
    function handleLoginError(data: { error: string }) {
      analytics.onPrivyLoginFailure(data);
      triggerLoader(false);

      if (data.error === 'linked_to_another_user') {
        logout();
        toggleLinkAccountModalOpen();
      }
    }

    // Link error handler
    async function handleLinkError(data: { error: string }) {
      const isLoggedIn = authStatus.isLoggedIn();
      const error = data.error as AuthErrorCode;

      if (!isLoggedIn) {
        analytics.onAccountLinkError({ type: 'loggedout', error });

        const recoverableErrors = ['linked_to_another_user', 'exited_link_flow', 'invalid_credentials'];

        if (recoverableErrors.includes(error)) {
          try {
            await deleteUser(error);
          } catch {
            triggerLoader(false);
            authEvents.emit('auth:invalid-email', error);
          }
        } else {
          await logout();
          setLinkAccountKey('');
          triggerLoader(false);
          authEvents.emit('auth:invalid-email', 'unexpected_error');
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
    function handleAddAccount(method: LinkMethod) {
      analytics.onPrivyAccountLink({ account: method });
      setLinkAccountKey(method);
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
        broadcastLogout();
      }
    }

    // Register typed event listeners using authEvents.on()
    const unsubscribers = [
      authEvents.on('auth:init-login', handleInitLogin),
      authEvents.on('auth:link-account', handleAddAccount),
      authEvents.on('auth:logout', handleLogout),
      authEvents.on('auth:login-success', handleLoginSuccess),
      authEvents.on('auth:link-success', handleLinkSuccess),
      authEvents.on('auth:login-error', handleLoginError),
      authEvents.on('auth:link-error', handleLinkError),
      authEvents.on('auth:logout-success', handleLogoutSuccess),
    ];

    return () => {
      // Cleanup all subscriptions
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, [
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

    const method = linkMethods[linkAccountKey];
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
