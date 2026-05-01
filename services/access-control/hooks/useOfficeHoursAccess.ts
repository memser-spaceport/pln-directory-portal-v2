import { useQuery } from '@tanstack/react-query';
import { AccessControlQueryKeys } from '@/services/access-control/constants';
import { fetchMyAccess } from '@/services/access-control/access-control.service';
import { getUserInfoFromLocal } from '@/utils/common.utils';

interface OfficeHoursAccessResult {
  canViewSupply: boolean;
  canSupply: boolean;
  canViewDemand: boolean;
  canRequestDemand: boolean;
}

const EMPTY: OfficeHoursAccessResult = {
  canViewSupply: false,
  canSupply: false,
  canViewDemand: false,
  canRequestDemand: false,
};

export function useOfficeHoursAccess() {
  const userInfo = getUserInfoFromLocal();

  const {
    data = EMPTY,
    isLoading,
    isError,
  } = useQuery({
    queryKey: [AccessControlQueryKeys.MY_ACCESS],
    queryFn: fetchMyAccess,
    select: (data): OfficeHoursAccessResult => ({
      canViewSupply: data.effectivePermissions.includes('oh.supply.read'),
      canSupply: data.effectivePermissions.includes('oh.supply.write'),
      canViewDemand: data.effectivePermissions.includes('oh.demand.read'),
      canRequestDemand: data.effectivePermissions.includes('oh.demand.write'),
    }),
    staleTime: 5 * 60 * 1000,
    enabled: !!userInfo,
    retry: 2,
  });

  return { ...data, isLoading, isError };
}
