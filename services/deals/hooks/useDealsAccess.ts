import { useQuery } from '@tanstack/react-query';
import { DealsQueryKeys } from '../constants';
import { checkDealsAccess } from '../deals.service';
import { fetchRbacMe } from '@/services/rbac/rbac.service';
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
      const [legacyAccess, rbac] = await Promise.all([checkDealsAccess(), fetchRbacMe()]);
      const rbacAccess = rbac.permissions.some((p) => p.name === 'deals.view');
      return legacyAccess || rbacAccess;
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!userInfo,
    retry: 2,
  });

  return { hasAccess, isLoading, isError };
}
