import { useEffect, useState } from 'react';
import usePrivyWrapper from '@/hooks/auth/usePrivyWrapper';
import { useRouter } from 'next/navigation';
import { decodeToken } from '@/utils/auth.utils';
import Cookies from 'js-cookie';
import { toast } from 'react-toastify';
import { EVENTS, TOAST_MESSAGES } from '@/utils/constants';
import { User } from '@privy-io/react-auth';
import { useAuthAnalytics } from '@/analytics/auth.analytics';
import { createLogoutChannel } from './broadcast-channel';
import { deletePrivyUser } from '@/services/auth.service';
import { triggerLoader } from '@/utils/common.utils';
import { getFollowUps } from '@/services/office-hours.service';

function PrivyModals() {
  const { getAccessToken, linkEmail, linkGithub, linkGoogle, linkWallet, login, logout, ready, unlinkEmail, updateEmail, user, PRIVY_CUSTOM_EVENTS } = usePrivyWrapper();
  const analytics = useAuthAnalytics();
  const [linkAccountKey, setLinkAccountKey] = useState('');
  const router = useRouter();

  const clearPrivyParams = () => {
    const queryString = window.location.search.substring(1);
    const params = new URLSearchParams(queryString);
    let queryParams = `?`;
    params?.forEach((value, key) => {
      if (!key.includes('privy_')) {
        queryParams = `${queryParams}${queryParams === '?' ? '' : '&'}${key}=${value}`;
      }
    });
    router.push(`${window.location.pathname}${queryParams === '?' ? '' : queryParams}`);
  };

  const getLinkedAccounts = (user: User) => {
    const userLinkedAccounts = user?.linkedAccounts ?? [];
    const linkedAccounts = userLinkedAccounts?.map((account: any) => {
      const linkedType = account?.type;
      if (linkedType === 'wallet') {
        return 'siwe';
      } else if (linkedType === 'google_oauth') {
        return 'google';
      } else if (linkedType === 'github_oauth') {
        return 'github';
      } else {
        return '';
      }
    });

    return linkedAccounts.filter((v: any) => v !== '').join(',');
  };

  const loginInUser = (output: any) => {
    clearPrivyParams();
  
    const showSuccessMessage = () => {
      setLinkAccountKey('');
      toast.success(TOAST_MESSAGES.LOGIN_MSG);
      Cookies.set('showNotificationPopup', JSON.stringify(true));
      document.dispatchEvent(new CustomEvent(EVENTS.GET_NOTIFICATIONS, { detail: { status: true, isShowPopup: false } }));
    };
  
    if (output.userInfo?.isFirstTimeLogin) {
      showSuccessMessage();
      window.location.href = '/settings/profile';
      return;
    }
  
    // For subsequent logins
    showSuccessMessage();
    
    // Reload the page after a delay
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };
  

  const saveTokensAndUserInfo = (output: any, user: User) => {
    const authLinkedAccounts = getLinkedAccounts(user);
    const accessTokenExpiry = decodeToken(output.accessToken);
    const refreshTokenExpiry = decodeToken(output.refreshToken);
    localStorage.removeItem('stateUid');
    Cookies.set('authToken', JSON.stringify(output.accessToken), {
      expires: new Date(accessTokenExpiry.exp * 1000),
      domain: process.env.COOKIE_DOMAIN || '',
    });

    Cookies.set('refreshToken', JSON.stringify(output.refreshToken), {
      expires: new Date(refreshTokenExpiry.exp * 1000),
      path: '/',
      domain: process.env.COOKIE_DOMAIN || '',
    });

    Cookies.set('userInfo', JSON.stringify(output.userInfo), {
      expires: new Date(accessTokenExpiry.exp * 1000),
      path: '/',
      domain: process.env.COOKIE_DOMAIN || '',
    });

    Cookies.set('authLinkedAccounts', JSON.stringify(authLinkedAccounts), {
      expires: new Date(refreshTokenExpiry.exp * 1000),
      path: '/',
      domain: process.env.COOKIE_DOMAIN || '',
    });
  };

  const deleteUser = async (errorCode: string) => {
    analytics.onPrivyUserDelete({ ...user, type: 'init' });
    const token = (await getAccessToken()) as string;
    await deletePrivyUser(token, user?.id as string);
    analytics.onPrivyUserDelete({ type: 'success' });
    setLinkAccountKey('');
    await logout();
    document.dispatchEvent(new CustomEvent('auth-invalid-email', { detail: errorCode }));
  };

  const handleInvalidDirectoryEmail = async () => {
    try {
      analytics.onDirectoryLoginFailure({ ...user, type: 'INVALID_DIRECTORY_EMAIL' });
      if (user?.email?.address && user?.linkedAccounts.length > 1) {
        analytics.onPrivyUnlinkEmail({ ...user, type: 'init' });
        await unlinkEmail(user?.email?.address);
        analytics.onPrivyUnlinkEmail({ type: 'success' });
        await deleteUser('');
      } else if (user?.email?.address && user?.linkedAccounts.length === 1) {
        setLinkAccountKey('');
        await deleteUser('');
      } else {
        await logout();
        document.dispatchEvent(new CustomEvent('auth-invalid-email'));
      }
    } catch (error) {
      document.dispatchEvent(new CustomEvent('auth-invalid-email'));
    }
  };

  const initDirectoryLogin = async () => {
    try {
      triggerLoader(true);
      const privyToken = await getAccessToken();
      const response = await fetch(`${process.env.DIRECTORY_API_URL}/v1/auth/token`, {
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

      if (response.status === 500) {
        triggerLoader(false);
        document.dispatchEvent(new CustomEvent('auth-invalid-email', { detail: 'unexpected_error' }));
        setLinkAccountKey('');
        await logout();
        return;
      }

      if (response.ok) {
        const result = await response.json();
        if (result?.isEmailChanged) {
          // document.dispatchEvent(new CustomEvent('auth-info-modal', { detail: 'email_changed' }));
        } else if (result?.isDeleteAccount && user) {
          if (user?.linkedAccounts?.length > 1) {
            await unlinkEmail(user?.email?.address as string);
            await deleteUser('email-changed');
          } else if (user?.email?.address && user?.linkedAccounts.length === 1) {
            setLinkAccountKey('');
            await deleteUser('email-changed');
          }
        } else {
          const formattedResult = structuredClone(result);
          delete formattedResult.userInfo.isFirstTimeLogin;
          saveTokensAndUserInfo(formattedResult, user as User);
          loginInUser(result);
          analytics.onDirectoryLoginSuccess();
        }
      }

      if (user?.email?.address && response.status === 403) {
        await handleInvalidDirectoryEmail();
      }
    } catch (error) {
      triggerLoader(false);
      document.dispatchEvent(new CustomEvent('auth-invalid-email', { detail: 'unexpected_error' }));
      setLinkAccountKey('');
      await logout();
    }
  };

  useEffect(() => {
    async function handlePrivyLoginSuccess(e: any) {
      const info = e.detail;
      analytics.onPrivyLoginSuccess(info?.user);
      // If email is not linked, link email mandatorily
      if (!info?.user?.email?.address) {
        setLinkAccountKey('email');
        return;
      }
      const stateUid = localStorage.getItem('stateUid');
      if (stateUid) {
        // If linked login user
        analytics.onDirectoryLoginInit({ ...info?.user, stateUid });
        await initDirectoryLogin();
      }
    }

    async function handlePrivyLinkSuccess(e: any) {
      const { linkMethod, linkedAccount } = e.detail;
      const authLinkedAccounts = getLinkedAccounts(e.detail.user);
      analytics.onPrivyLinkSuccess({ linkMethod, linkedAccount, authLinkedAccounts });
      if (linkMethod === 'email') {
        const userInfo = Cookies.get('userInfo');
        const accessToken = Cookies.get('accessToken');
        const refreshToken = Cookies.get('refreshToken');
        if (!userInfo && !accessToken && !refreshToken) {
          // Initiate Directory Login to validate email and login user
          const stateUid = localStorage.getItem('stateUid');
          analytics.onDirectoryLoginInit({ ...e?.detail?.user, stateUid, linkedAccount });
          await initDirectoryLogin();
        } else {
          triggerLoader(true);
          document.dispatchEvent(new CustomEvent('directory-update-email', { detail: { newEmail: linkedAccount.address } }));
        }
      } else if (linkMethod === 'github') {
        document.dispatchEvent(new CustomEvent('new-auth-accounts', { detail: authLinkedAccounts }));
        toast.success('Github linked successfully');
      } else if (linkMethod === 'google') {
        document.dispatchEvent(new CustomEvent('new-auth-accounts', { detail: authLinkedAccounts }));
        toast.success('Google linked successfully');
      } else if (linkMethod === 'siwe') {
        document.dispatchEvent(new CustomEvent('new-auth-accounts', { detail: authLinkedAccounts }));
        toast.success('Wallet linked successfully');
      }
      setLinkAccountKey('');
    }

    function handlePrivyLoginError(e: CustomEvent) {
      triggerLoader(false);
      console.log('Privy login error');
    }

    async function handlePrivyLinkError(e: any) {
      const userInfo = Cookies.get('userInfo');
      const accessToken = Cookies.get('accessToken');
      const refreshToken = Cookies.get('refreshToken');

      if (!userInfo && !accessToken && !refreshToken) {
        analytics.onAccountLinkError({ type: 'loggedout', error: e?.detail?.error });
        if (e?.detail?.error === 'linked_to_another_user' || e?.detail?.error === 'exited_link_flow' || e?.detail?.error === 'invalid_credentials') {
          try {
            await deleteUser(e?.detail?.error);
          } catch (err) {
            triggerLoader(false);
            document.dispatchEvent(new CustomEvent('auth-invalid-email', { detail: e?.detail?.error }));
          }
        } else {
          await logout();
          setLinkAccountKey('');
          triggerLoader(false);
          document.dispatchEvent(new CustomEvent('auth-invalid-email', { detail: 'unexpected_error' }));
        }
      } else {
        analytics.onAccountLinkError({ type: 'loggedin', error: e?.detail?.error });
      }
    }
    async function initPrivyLogin() {
      const stateUid = localStorage.getItem('stateUid');
      if (stateUid) {
        login();
      }
    }
    function addAccountToPrivy(e: CustomEvent) {
      analytics.onPrivyAccountLink({ account: e?.detail });
      setLinkAccountKey(e.detail);
    }
    async function handlePrivyLogout() {
      Cookies.remove('authLinkedAccounts');
      await logout();
    }

    async function handlePrivyLogoutSuccess() {
      const isDirectory = localStorage.getItem('directory-logout');
      if (isDirectory) {
        localStorage.clear();
        toast.info(TOAST_MESSAGES.LOGOUT_MSG);
        createLogoutChannel().postMessage('logout');
      }
    }

    document.addEventListener('privy-init-login', initPrivyLogin);
    document.addEventListener('auth-link-account', addAccountToPrivy as EventListener);
    document.addEventListener('init-privy-logout', handlePrivyLogout);
    document.addEventListener(PRIVY_CUSTOM_EVENTS.AUTH_LOGIN_SUCCESS, handlePrivyLoginSuccess);
    document.addEventListener(PRIVY_CUSTOM_EVENTS.AUTH_LINK_ACCOUNT_SUCCESS, handlePrivyLinkSuccess);
    document.addEventListener(PRIVY_CUSTOM_EVENTS.AUTH_LOGIN_ERROR, handlePrivyLoginError as EventListener);
    document.addEventListener(PRIVY_CUSTOM_EVENTS.AUTH_LINK_ERROR, handlePrivyLinkError);
    document.addEventListener('privy-logout-success', handlePrivyLogoutSuccess);
    return function () {
      document.removeEventListener('privy-init-login', initPrivyLogin);
      document.removeEventListener('auth-link-account', addAccountToPrivy as EventListener);
      document.removeEventListener('init-privy-logout', handlePrivyLogout);
      document.removeEventListener(PRIVY_CUSTOM_EVENTS.AUTH_LOGIN_SUCCESS, handlePrivyLoginSuccess);
      document.removeEventListener(PRIVY_CUSTOM_EVENTS.AUTH_LINK_ACCOUNT_SUCCESS, handlePrivyLinkSuccess);
      document.removeEventListener(PRIVY_CUSTOM_EVENTS.AUTH_LOGIN_ERROR, handlePrivyLoginError as EventListener);
      document.removeEventListener(PRIVY_CUSTOM_EVENTS.AUTH_LINK_ERROR, handlePrivyLinkError);
      document.removeEventListener('privy-logout-success', handlePrivyLogoutSuccess);
    };
  }, [user, login, logout, ready]);

  /**** FIX NEEDED: Currently privy link methods throws errors when called directly. Requires useEffect based setup like below *****/
  useEffect(() => {
    if (linkAccountKey === 'github') {
      linkGithub();
      setLinkAccountKey('');
    } else if (linkAccountKey === 'google') {
      linkGoogle();
      setLinkAccountKey('');
    } else if (linkAccountKey === 'siwe') {
      linkWallet();
      setLinkAccountKey('');
    } else if (linkAccountKey === 'email') {
      linkEmail();
      setLinkAccountKey('');
    } else if (linkAccountKey === 'updateEmail') {
      updateEmail();
      setLinkAccountKey('');
    }
  }, [linkAccountKey]);

  return (
    <>
      <style jsx global>
        {`
          #privy-modal-content {
            overflow-y: auto !important;
            scrollbar-width: thin;
          }

          #privy-modal-content img[alt='PL Network logo'] {
            max-width: none !important;
            width: 100% !important;
            object-fit: cover;
            object-position: top;
            margin: 0;
            padding: 0;
            max-height: fit-content !important;
          }

          div:has(> img[alt='PL Network logo']) {
            padding: 0;
          }

          #privy-modal-content img[alt='Protocol Labs logo'] {
            max-width: none !important;
            width: 100% !important;
            object-fit: cover;
            object-position: top;
            margin: 0;
            padding: 0;
            max-height: fit-content !important;
          }

          div:has(> img[alt='Protocol Labs logo']) {
            padding: 0;
          }

          .hide-on-mobile {
            display: none !important;
          }
        `}
      </style>
    </>
  );
}

export default PrivyModals;
