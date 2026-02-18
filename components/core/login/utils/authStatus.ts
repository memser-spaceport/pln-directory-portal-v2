import { IUserInfo } from '@/types/shared.types';
import { getAuthToken, getRefreshToken, getRawUserInfoCookie, getUserInfo } from '@/utils/cookie.utils';

/**
 * Centralized auth status utilities for checking authentication state
 * Used in event handlers and other non-React contexts
 */
export const authStatus = {
  isLoggedIn: () => {
    const userInfo = getRawUserInfoCookie();
    const accessToken = getAuthToken();
    const refreshToken = getRefreshToken();
    return Boolean(userInfo || accessToken || refreshToken);
  },

  getUserInfo: (): IUserInfo | null => {
    return getUserInfo() || null;
  },
};
