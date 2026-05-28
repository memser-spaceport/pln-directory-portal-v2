'use client';

import { useQuery } from '@tanstack/react-query';
import { AccessControlQueryKeys } from '@/services/access-control/constants';
import { fetchMyAccess } from '@/services/access-control/access-control.service';
import { useCurrentUserStore } from '@/services/auth/store';

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
  const { currentUser } = useCurrentUserStore();
  const { data, isLoading, isError } = useQuery({
    queryKey: [AccessControlQueryKeys.MY_ACCESS, 'gantry'],
    queryFn: fetchMyAccess,
    staleTime: 5 * 60 * 1000,
    enabled: !!currentUser,
    retry: 2,
  });

  const perms = new Set(data?.effectivePermissions ?? []);

  return {
    canView: perms.has(PERM_VIEW),
    canCreateIdea: perms.has(PERM_CREATE),
    canUpvote: perms.has(PERM_UPVOTE),
    canEditOwn: perms.has(PERM_EDIT_OWN),
    canCurate: perms.has(PERM_CURATE),
    canTransition: perms.has(PERM_TRANSITION),
    isLoading,
    isError,
  };
}
