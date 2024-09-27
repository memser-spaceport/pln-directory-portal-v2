import { renewAccessToken } from '@/services/auth.service';
import { decodeToken } from './auth.utils';
import Cookies from 'js-cookie';
import { getParsedValue } from './common.utils';
import { toast } from 'react-toastify';
import { TOAST_MESSAGES } from './constants';
import { clearAllAuthCookies } from './third-party.helper';
import { createLogoutChannel } from '@/components/core/login/broadcast-channel';

const getAuthInfoFromCookie = () => {
  const userInfo = getParsedValue(Cookies.get('userInfo'));
  const authToken = getParsedValue(Cookies.get('authToken'));
  const refreshToken = getParsedValue(Cookies.get('refreshToken'));
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
      const { accessToken: newAuthToken, refreshToken: newRefreshToken, userInfo } = await renewTokens(refreshToken);
      setNewTokenAndUserInfoAtClientSide({ refreshToken: newRefreshToken, accessToken: newAuthToken, userInfo });
      const response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          Authorization: `Bearer ${newAuthToken}`,
        },
      });
      return response;
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
    Cookies.set('authToken', JSON.stringify(accessToken), {
      expires: new Date(accessTokenExpiry.exp * 1000),
      path: '/',
      domain: process.env.COOKIE_DOMAIN || '',
    });

    Cookies.set('refreshToken', JSON.stringify(refreshToken), {
      expires: new Date(refreshTokenExpiry.exp * 1000),
      path: '/',
      domain: process.env.COOKIE_DOMAIN || '',
    });
    Cookies.set('userInfo', JSON.stringify(userInfo), {
      expires: new Date(accessTokenExpiry.exp * 1000),
      path: '/',
      domain: process.env.COOKIE_DOMAIN || '',
    });
  }
};

const renewTokens = async (refreshToken: string) => {
  const renewAccessTokenResponse = await renewAccessToken(refreshToken);
  return renewAccessTokenResponse?.data;
};

const retryApi = async (url: string, options: any) => {
  const { refreshToken } = getAuthInfoFromCookie();
  const { accessToken: newAuthToken, refreshToken: newRefreshToken, userInfo } = await renewTokens(refreshToken);
  setNewTokenAndUserInfoAtClientSide({ refreshToken: newRefreshToken, accessToken: newAuthToken, userInfo });
  return await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${newAuthToken}`,
    },
  });
};

export const logoutUser = () => {
  clearAllAuthCookies();
  document.dispatchEvent(new CustomEvent('init-privy-logout'));
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
  logoutUser()
  return {
    isLoginRequired: true,
  };
};
