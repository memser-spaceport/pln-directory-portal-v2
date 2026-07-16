'use client';

import { useQuery } from '@tanstack/react-query';

import { AccessControlQueryKeys } from '@/services/access-control/constants';
import { fetchMyAccess } from '@/services/access-control/access-control.service';
import { useCurrentUserStore } from '@/services/auth/store';

/**
 * Client-side mirror of the backend's canManage rule (creator or directory
 * admin) — used ONLY to decide whether a card renders the ⋯ trigger without
 * firing N detail fetches on the list. The authoritative gate stays the
 * detail endpoint's `canManage` (checked when the menu opens), and the server
 * enforces every mutation regardless of what the client shows.
 *
 * Query options must stay identical to useAiAppFeedbackReviewAccess so both
 * observers of the shared MY_ACCESS key agree on freshness.
 */
export function useAiAppManageAccess() {
  const { currentUser } = useCurrentUserStore();

  const { data: isDirectoryAdmin = false } = useQuery({
    queryKey: [AccessControlQueryKeys.MY_ACCESS],
    queryFn: fetchMyAccess,
    select: (data) => data.effectivePermissions.includes('directory.admin.full'),
    staleTime: 5 * 60 * 1000,
    enabled: !!currentUser,
    retry: 2,
  });

  const canLikelyManage = (memberUid: string) =>
    isDirectoryAdmin || (!!currentUser?.uid && currentUser.uid === memberUid);

  return { canLikelyManage, isDirectoryAdmin };
}
