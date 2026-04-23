import { useQuery } from '@tanstack/react-query';
import { AccessControlQueryKeys } from '@/services/access-control/constants';
import { fetchMyAccess } from '@/services/access-control/access-control.service';
import { getUserInfoFromLocal } from '@/utils/common.utils';

export function useDemoDayAnalyticsAccess() {
  const userInfo = getUserInfoFromLocal();

  const {
    data: hasAccess = false,
    isLoading,
    isError,
  } = useQuery({
    queryKey: [AccessControlQueryKeys.MY_ACCESS],
    queryFn: fetchMyAccess,
    select: (data) => data.effectivePermissions.includes('demoday.stats.read'),
    staleTime: 5 * 60 * 1000,
    enabled: !!userInfo,
    retry: 2,
  });

  return { hasAccess, isLoading, isError };
}
