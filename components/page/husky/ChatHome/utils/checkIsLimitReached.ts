import Cookies from 'js-cookie';

import { DAILY_CHAT_LIMIT } from '@/utils/constants';

import { getChatCount } from '@/utils/husky.utlils';
import { getParsedValue } from '@/utils/common.utils';

export function checkIsLimitReached() {
  if (getParsedValue(Cookies.get('refreshToken'))) {
    return false;
  }
  return DAILY_CHAT_LIMIT <= getChatCount();
}
