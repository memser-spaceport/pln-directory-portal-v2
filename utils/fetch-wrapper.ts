import { renewAccessToken } from '@/services/auth.service';
import { decodeToken } from './auth.utils';
import Cookies from 'js-cookie';
import { getParsedValue } from './common.utils';
import { toast } from 'react-toastify';
import { TOAST_MESSAGES } from './constants';

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
