'use client';

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

  return {
    canView: !isLoading && !isError && canViewPlaa(permsSet),
    isLoading,
    isError,
  };
}
