import { refreshSession } from '@/services/session.service';
import Cookies from 'js-cookie';
import { getParsedValue } from './common.utils';
import { toast } from '@/components/core/ToastContainer';
import { TOAST_MESSAGES } from './constants';
import { clearAllAuthCookies, hasSession } from './third-party.helper';
import { authEvents } from '@/components/core/login/utils';

const getAuthInfoFromCookie = () => {
  const userInfo = getParsedValue(Cookies.get('userInfo'));
  const authToken = getParsedValue(Cookies.get('authToken'));
  return { userInfo, authToken };
};

const signOutAndReload = async () => {
  await logoutUser();
  toast.success(TOAST_MESSAGES.LOGOUT_MSG);
  window.location.reload();
};

export const customFetch = async (url: string, options: any, isIncludeToken: boolean) => {
  if (isIncludeToken) {
    const { authToken } = getAuthInfoFromCookie();
    if (!hasSession()) {
      await signOutAndReload();
      return;
    }

    if (!authToken) {
      try {
        const session = await refreshSession();
        if (!session) {
          await signOutAndReload();
          return;
        }
        return await fetch(url, {
          ...options,
          headers: {
            ...options.headers,
            Authorization: `Bearer ${session.accessToken}`,
          },
        });
      } catch (error) {
        await signOutAndReload();
        return;
      }
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${authToken}`,
      },
    });

    if (!response.ok && response.status === 401) {
      const newResponse = await retryApi(url, options);
      if (!newResponse.ok && newResponse.status === 401) {
        await signOutAndReload();
      }
      return newResponse;
    }
    return response;
  }
  return await fetch(url, options);
};

/** Renews the session on the server (the refresh token is httpOnly) and repeats the call once. */
const retryApi = async (url: string, options: any) => {
  const session = hasSession() ? await refreshSession() : null;
  if (!session) {
    await signOutAndReload();
    return new Response(null, { status: 401 });
  }

  try {
    return await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${session.accessToken}`,
      },
    });
  } catch (error) {
    await signOutAndReload();
    return new Response(null, { status: 401 });
  }
};

/** Signs the browser out; await it before reloading or navigating. */
export const logoutUser = async () => {
  await clearAllAuthCookies();
  authEvents.emit('auth:logout');
};

export const getUserCredentialsInfo = async () => {
  const { authToken, userInfo } = getAuthInfoFromCookie();
  if (userInfo && authToken) {
    return {
      newUserInfo: userInfo,
      newAuthToken: authToken,
    };
  } else if (hasSession()) {
    const session = await refreshSession();
    if (!session) {
      return {
        isLoginRequired: true,
        status: 401,
      };
    }
    return {
      newUserInfo: session.userInfo,
      newAuthToken: session.accessToken,
    };
  }
  return {
    isLoginRequired: true,
  };
};
