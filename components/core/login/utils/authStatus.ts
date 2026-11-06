import Cookies from 'js-cookie';
import { IUserInfo } from '@/types/shared.types';
import { getParsedValue } from '@/utils/common.utils';
import { hasSession } from '@/utils/third-party.helper';

/**
 * Centralized auth status utilities for checking authentication state
 * Used in event handlers and other non-React contexts
 */
export const authStatus = {
  isLoggedIn: () => {
    const userInfo = Cookies.get('userInfo');
    const accessToken = Cookies.get('authToken');
    return Boolean(userInfo || accessToken || hasSession());
  },

  getUserInfo: (): IUserInfo | null => {
    const userInfo = Cookies.get('userInfo');
    if (!userInfo) return null;
    return getParsedValue(userInfo);
  },
};
