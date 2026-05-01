import { useQuery } from '@tanstack/react-query';
import { AccessControlQueryKeys } from '@/services/access-control/constants';
import { fetchMyAccess } from '@/services/access-control/access-control.service';
import { getUserInfoFromLocal } from '@/utils/common.utils';

interface IrlGoingAccessResult {
  canRead: boolean;
  canWrite: boolean;
}

const EMPTY: IrlGoingAccessResult = { canRead: false, canWrite: false };

export function useIrlGoingAccess() {
  const userInfo = getUserInfoFromLocal();

  const {
    data = EMPTY,
    isLoading,
    isError,
  } = useQuery({
    queryKey: [AccessControlQueryKeys.MY_ACCESS],
    queryFn: fetchMyAccess,
    select: (data): IrlGoingAccessResult => ({
      canRead:
        data.effectivePermissions.includes('irlg.going.read') ||
        data.effectivePermissions.includes('directory.admin.full'),
      canWrite:
        data.effectivePermissions.includes('irlg.going.write') ||
        data.effectivePermissions.includes('directory.admin.full'),
    }),
    staleTime: 5 * 60 * 1000,
    enabled: !!userInfo,
    retry: 2,
  });

  return { canRead: data.canRead, canWrite: data.canWrite, isLoading, isError };
}
