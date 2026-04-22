import { useQuery } from '@tanstack/react-query';
import { AccessControlQueryKeys } from '@/services/access-control/constants';
import { fetchMyAccess } from '@/services/access-control/access-control.service';
import { getUserInfoFromLocal } from '@/utils/common.utils';

export function useFounderGuidesCreateAccess() {
  const userInfo = getUserInfoFromLocal();

  const {
    data: canCreate = false,
    isLoading,
    isError,
  } = useQuery({
    queryKey: [AccessControlQueryKeys.MY_ACCESS],
    queryFn: fetchMyAccess,
    select: (data) => data.effectivePermissions.includes('founder_guides.view.all'),
    staleTime: 5 * 60 * 1000,
    enabled: !!userInfo,
    retry: 2,
  });

  return { canCreate, isLoading, isError };
}
