'use client';

import { useQuery } from '@tanstack/react-query';

import { AccessControlQueryKeys } from '@/services/access-control/constants';
import { fetchMyAccess } from '@/services/access-control/access-control.service';
import { usePermissions } from '@/services/rbac/hooks/usePermissions';
import { canViewPlaa } from '@/services/rbac/utils/plaa/canViewPlaa';

export interface PlaaAccess {
  canView: boolean;
  isLoading: boolean;
  isError: boolean;
}

/**
 * "PLAA member" per Directory RBAC: a LabOS member holding `plaa.access`.
 * Directory is the source of truth — this replaces the old Privy whitelist.
 */
export function usePlaaAccess(): PlaaAccess {
  const { permsSet, isLoading, isError } = usePermissions();
  const { data: lookupFailed = false } = useQuery({
    queryKey: [AccessControlQueryKeys.MY_ACCESS],
    queryFn: fetchMyAccess,
    enabled: false,
    select: (access) => access.memberUid === '',
  });
  const hasError = isError || lookupFailed;

  return {
    canView: !isLoading && !hasError && canViewPlaa(permsSet),
    isLoading,
    isError: hasError,
  };
}
