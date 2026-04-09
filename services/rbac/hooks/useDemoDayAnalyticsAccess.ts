import { useQuery } from '@tanstack/react-query';
import { RbacQueryKeys } from '../constants';
import { fetchRbacMe } from '../rbac.service';
import { getUserInfoFromLocal } from '@/utils/common.utils';

export function useDemoDayAnalyticsAccess() {
  const userInfo = getUserInfoFromLocal();

  const {
    data: hasAccess = false,
    isLoading,
    isError,
  } = useQuery({
    queryKey: [RbacQueryKeys.RBAC_ME, 'demo-day-analytics'],
    queryFn: async () => {
      const rbac = await fetchRbacMe();
      return rbac.permissions.includes('demo_day.report_link.view');
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!userInfo,
    retry: 2,
  });

  return { hasAccess, isLoading, isError };
}
