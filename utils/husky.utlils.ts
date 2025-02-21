import { getParsedValue } from './common.utils';
import { DAILY_CHAT_LIMIT } from './constants';
import Cookies from 'js-cookie';

const COOKIE_NAME = 'dailyChats';

export const checkRefreshToken = (): boolean => {
  const refreshToken = getParsedValue(Cookies.get('refreshToken'));
  if (refreshToken) return true;
  return false;
};

export const updateChatCount = (): number => {
  if (DAILY_CHAT_LIMIT < getChatCount()) {
    return getChatCount();
  }
  const currentCount = getChatCount() + 1;
  const midnight = new Date();
  midnight.setHours(23, 59, 59, 999);
  Cookies.set(COOKIE_NAME, currentCount.toString(), { expires: midnight });
  return currentCount;
};

export const updateLimitType = () => {
  if (DAILY_CHAT_LIMIT + 1 <= getChatCount()) {
    return 'warn';
  } else if (DAILY_CHAT_LIMIT === getChatCount()) {
    return 'finalRequest';
  } else if (DAILY_CHAT_LIMIT - getChatCount() < 4) {
    return 'info';
  }
  return null;
};

export const getChatCount = (): number => {
  return parseInt(Cookies.get(COOKIE_NAME) || '0', 10);
};
