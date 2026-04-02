import { ADVISOR_WHITELISTED_FOUNDERS } from '@/config/advisors';
import { getUserInfoFromLocal } from '@/utils/common.utils';

export function useAdvisorsAccess() {
  const userInfo = getUserInfoFromLocal();
  // TODO: restrict to whitelist before production
  const hasAccess = !!userInfo;
  return { hasAccess };
}
