'use client';

import { useQuery } from '@tanstack/react-query';
import { AccessControlQueryKeys } from '@/services/access-control/constants';
import { fetchMyAccess } from '@/services/access-control/access-control.service';
import { useCurrentUserStore } from '@/services/auth/store';

const PERM_ADMIN = 'roadmap.admin';
const PERM_VIEW = 'roadmap.view';
const PERM_CREATE = 'roadmap.idea.create';
const PERM_UPVOTE = 'roadmap.item.upvote';
const PERM_EDIT_OWN = 'roadmap.item.edit_own';
const PERM_CURATE = 'roadmap.item.curate';
const PERM_TRANSITION = 'roadmap.item.transition';

export type GantryAccess = {
  canView: boolean;
  canCreateIdea: boolean;
  canUpvote: boolean;
  canEditOwn: boolean;
  canCurate: boolean;
  canTransition: boolean;
  isLoading: boolean;
  isError: boolean;
};

export function useGantryAccess(): GantryAccess {
  const { currentUser, isHydrated } = useCurrentUserStore();
  const { data, isPending, isError } = useQuery({
    queryKey: [AccessControlQueryKeys.MY_ACCESS, 'gantry'],
    queryFn: fetchMyAccess,
    staleTime: 5 * 60 * 1000,
    enabled: !!currentUser,
    retry: 2,
  });

  const perms = new Set(data?.effectivePermissions ?? []);
  const isAdmin = perms.has(PERM_ADMIN);
  // Same as usePermissions: ignore background isFetching so access guards don't
  // unmount children (and wipe form state) on window-focus refetch.
  const isLoading = !isHydrated || (!!currentUser && isPending);

  return {
    canView: isAdmin || perms.has(PERM_VIEW),
    canCreateIdea: isAdmin || perms.has(PERM_CREATE),
    canUpvote: isAdmin || perms.has(PERM_UPVOTE),
    canEditOwn: isAdmin || perms.has(PERM_EDIT_OWN),
    canCurate: isAdmin || perms.has(PERM_CURATE),
    canTransition: isAdmin || perms.has(PERM_TRANSITION),
    isLoading,
    isError,
  };
}
