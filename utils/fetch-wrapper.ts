import { renewAccessToken } from '@/services/auth.service';
import { decodeToken } from './auth.utils';
import { toast } from '@/components/core/ToastContainer';
import { TOAST_MESSAGES } from './constants';
import { clearAllAuthCookies } from './third-party.helper';
import { authEvents } from '@/components/core/login/utils';
import { getAuthToken, getRefreshToken, getUserInfo, setAuthToken, setRefreshToken, setUserInfoCookie } from './cookie.utils';

const getAuthInfoFromCookie = () => {
  const userInfo = getUserInfo();
  const authToken = getAuthToken();
  const refreshToken = getRefreshToken();
  return { userInfo, authToken, refreshToken };
};

export const customFetch = async (url: string, options: any, isIncludeToken: boolean) => {
  if (isIncludeToken) {
    const { authToken, refreshToken } = getAuthInfoFromCookie();
    if (!refreshToken) {
      toast.success(TOAST_MESSAGES.LOGOUT_MSG);
      window.location.reload();
      return;
    }

    if (!authToken && refreshToken) {
      console.log('Fetch wrapper - renewTokens called with refreshToken:', refreshToken, url);
      try {
        const tokens = await renewTokens(refreshToken);
        if (!tokens || !tokens.accessToken || !tokens.refreshToken || !tokens.userInfo) {
          // Refresh failed - clear cookies and logout
          clearAllAuthCookies();
          logoutUser();
          toast.success(TOAST_MESSAGES.LOGOUT_MSG);
          window.location.reload();
          return;
        }
        const { accessToken: newAuthToken, refreshToken: newRefreshToken, userInfo } = tokens;
        setNewTokenAndUserInfoAtClientSide({ refreshToken: newRefreshToken, accessToken: newAuthToken, userInfo });
        const response = await fetch(url, {
          ...options,
          headers: {
            ...options.headers,
            Authorization: `Bearer ${newAuthToken}`,
          },
        });
        return response;
      } catch (error) {
        clearAllAuthCookies();
        logoutUser();
        toast.success(TOAST_MESSAGES.LOGOUT_MSG);
        window.location.reload();
        return;
      }
    }

    if (authToken) {
      let response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (!response.ok && response.status === 401) {
        const newResponse = await retryApi(url, options);
        if (!newResponse.ok && newResponse.status === 401) {
          toast.success(TOAST_MESSAGES.LOGOUT_MSG);
          window.location.reload();
        } else if (!newResponse.ok) {
          return newResponse;
        }
        return newResponse;
      } else if (!response.ok) {
        return response;
      }
      return response;
    }
  }
  return await fetch(url, options);
};

export const setNewTokenAndUserInfoAtClientSide = (details: any) => {
  const { refreshToken, accessToken, userInfo } = details;
  const accessTokenExpiry = decodeToken(accessToken) as any;
  const refreshTokenExpiry = decodeToken(refreshToken) as any;

  if (refreshToken && accessToken && userInfo) {
    setAuthToken(accessToken, new Date(accessTokenExpiry.exp * 1000));
    setRefreshToken(refreshToken, new Date(refreshTokenExpiry.exp * 1000));
    setUserInfoCookie(userInfo, new Date(accessTokenExpiry.exp * 1000));
  }
};

const renewTokens = async (refreshToken: string) => {
  console.log('Fetch wrapper - renewTokens called with refreshToken:', refreshToken);
  const renewAccessTokenResponse = await renewAccessToken(refreshToken);

  // If refresh failed, return null to signal failure
  if (!renewAccessTokenResponse?.ok || !renewAccessTokenResponse?.data) {
    return null;
  }

  return renewAccessTokenResponse.data;
};

const retryApi = async (url: string, options: any) => {
  console.log('Fetch wrapper - retry api called:', url);
  const { refreshToken } = getAuthInfoFromCookie();

  if (!refreshToken) {
    clearAllAuthCookies();
    logoutUser();
    toast.success(TOAST_MESSAGES.LOGOUT_MSG);
    window.location.reload();
    return new Response(null, { status: 401 });
  }

  try {
    const tokens = await renewTokens(refreshToken);
    if (!tokens || !tokens.accessToken || !tokens.refreshToken || !tokens.userInfo) {
      // Refresh failed - clear cookies and logout
      clearAllAuthCookies();
      logoutUser();
      toast.success(TOAST_MESSAGES.LOGOUT_MSG);
      window.location.reload();
      return new Response(null, { status: 401 });
    }

    const { accessToken: newAuthToken, refreshToken: newRefreshToken, userInfo } = tokens;
    setNewTokenAndUserInfoAtClientSide({ refreshToken: newRefreshToken, accessToken: newAuthToken, userInfo });
    return await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${newAuthToken}`,
      },
    });
  } catch (error) {
    clearAllAuthCookies();
    logoutUser();
    toast.success(TOAST_MESSAGES.LOGOUT_MSG);
    window.location.reload();
    return new Response(null, { status: 401 });
  }
};

export const logoutUser = () => {
  clearAllAuthCookies();
  authEvents.emit('auth:logout');
};

export const getUserCredentialsInfo = async () => {
  const { authToken, refreshToken, userInfo } = getAuthInfoFromCookie();
  if (userInfo && authToken) {
    return {
      newUserInfo: userInfo,
      newAuthToken: authToken,
      newRefreshToken: refreshToken,
    };
  } else if ((!userInfo || !authToken) && refreshToken) {
    const renewOuput = await renewAccessToken(refreshToken);
    if (!renewOuput.ok) {
      return {
        isLoginRequired: true,
        status: renewOuput?.status,
      };
    }
    setNewTokenAndUserInfoAtClientSide({ ...renewOuput?.data });
    return {
      newUserInfo: renewOuput?.data?.userInfo,
      newAuthToken: renewOuput?.data?.accessToken,
      newRefreshToken: renewOuput?.data?.refreshToken,
    };
  }
  // logoutUser()
  return {
    isLoginRequired: true,
  };
};
