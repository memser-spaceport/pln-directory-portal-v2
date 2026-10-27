import { DAILY_CHAT_LIMIT } from '@/utils/constants';

import { getChatCount } from '@/utils/husky.utlils';
import { hasSession } from '@/utils/third-party.helper';

export function checkIsLimitReached() {
  if (hasSession()) {
    return false;
  }
  return DAILY_CHAT_LIMIT <= getChatCount();
}
