import { ADVISOR_WHITELISTED_FOUNDERS } from '@/config/advisors';
import { getUserInfoFromLocal } from '@/utils/common.utils';

export function useAdvisorsAccess() {
  const userInfo = getUserInfoFromLocal();
  const hasAccess = !!userInfo && ADVISOR_WHITELISTED_FOUNDERS.includes(userInfo.uid);
  return { hasAccess };
}
