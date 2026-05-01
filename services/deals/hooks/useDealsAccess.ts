import { useQuery } from '@tanstack/react-query';
import { DealsQueryKeys } from '../constants';
import { checkDealsAccess } from '../deals.service';
import { fetchMyAccess } from '@/services/access-control/access-control.service';
import { getUserInfoFromLocal } from '@/utils/common.utils';

export function useDealsAccess() {
  const userInfo = getUserInfoFromLocal();

  const {
    data: hasAccess = false,
    isLoading,
    isError,
  } = useQuery({
    queryKey: [DealsQueryKeys.DEALS_ACCESS],
    queryFn: async () => {
      const [legacyAccess, access] = await Promise.all([checkDealsAccess(), fetchMyAccess()]);
      const rbacAccess = access.effectivePermissions.includes('deals.read');
      return legacyAccess || rbacAccess;
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!userInfo,
    retry: 2,
  });

  return { hasAccess, isLoading, isError };
}
