'use client';

import { useQuery } from '@tanstack/react-query';

import { useCurrentUserStore } from '@/services/auth/store';
import { AccessControlQueryKeys } from '@/services/access-control/constants';
import { fetchMyAccess, MyAccessResponse } from '@/services/access-control/access-control.service';

export interface UsePermissionsResult {
  permissions: string[];
  permsSet: Set<string>;
  isLoading: boolean;
  isError: boolean;
}

export function usePermissions(): UsePermissionsResult {
  const { currentUser, isHydrated } = useCurrentUserStore();

  const { data, isPending, isFetching, isError } = useQuery<MyAccessResponse>({
    queryKey: [AccessControlQueryKeys.MY_ACCESS],
    queryFn: fetchMyAccess,
    staleTime: 5 * 60 * 1000,
    enabled: !!currentUser,
    retry: 2,
  });

  const permissions = data?.effectivePermissions ?? [];
  const permsSet = new Set(permissions);

  const isLoading = !isHydrated || (!!currentUser && (isPending || isFetching));

  return {
    permsSet,
    permissions,
    isLoading,
    isError,
  };
}
