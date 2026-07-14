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

  const { data, isPending, isError } = useQuery<MyAccessResponse>({
    queryKey: [AccessControlQueryKeys.MY_ACCESS],
    queryFn: fetchMyAccess,
    staleTime: 5 * 60 * 1000,
    // Permissions rarely change mid-session; skipping focus refetch avoids the
    // access-guard remount path that wiped in-progress AI Apps secret drafts.
    refetchOnWindowFocus: false,
    enabled: !!currentUser,
    retry: 2,
  });

  const permissions = data?.effectivePermissions ?? [];
  const permsSet = new Set(permissions);

  // Only treat the initial fetch as loading — background refetches (e.g. window
  // focus after staleTime) must not flip isLoading, or access guards that return
  // null while loading will unmount pages and wipe in-progress form state
  // (notably the AI Apps secrets panel).
  const isLoading = !isHydrated || (!!currentUser && isPending);

  return {
    permsSet,
    permissions,
    isLoading,
    isError,
  };
}
