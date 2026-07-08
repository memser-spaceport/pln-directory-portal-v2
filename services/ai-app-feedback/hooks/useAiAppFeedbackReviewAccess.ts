'use client';

import { useQuery } from '@tanstack/react-query';
import { AccessControlQueryKeys } from '@/services/access-control/constants';
import { fetchMyAccess } from '@/services/access-control/access-control.service';
import { useCurrentUserStore } from '@/services/auth/store';
import { useAiApps } from '@/services/ai-apps/hooks/useAiApps';

interface AiAppFeedbackReviewAccessResult {
  isDirectoryAdmin: boolean;
  /** Directory admin, or a member who created at least one AI App. */
  canReview: boolean;
  isLoading: boolean;
  isError: boolean;
}

/**
 * No dedicated feedback.review permission exists (confirmed against docs/rbac-v2.md
 * and a repo-wide grep) — review access is derived: directory.admin.full, the same
 * admin-override permission useIrlGoingAccess.ts already checks, OR ownership of at
 * least one AI App (app.member.uid === currentUser.uid).
 */
export function useAiAppFeedbackReviewAccess(): AiAppFeedbackReviewAccessResult {
  const { currentUser } = useCurrentUserStore();
  const { apps, isLoading: isAppsLoading, isError: isAppsError } = useAiApps();

  const {
    data: isDirectoryAdmin = false,
    isLoading: isAccessLoading,
    isError: isAccessError,
  } = useQuery({
    queryKey: [AccessControlQueryKeys.MY_ACCESS],
    queryFn: fetchMyAccess,
    select: (data) => data.effectivePermissions.includes('directory.admin.full'),
    staleTime: 5 * 60 * 1000,
    enabled: !!currentUser,
    retry: 2,
  });

  const ownsAtLeastOneApp = apps.some((app) => app.member.uid === currentUser?.uid);

  return {
    isDirectoryAdmin,
    canReview: isDirectoryAdmin || ownsAtLeastOneApp,
    isLoading: isAppsLoading || isAccessLoading,
    isError: isAppsError || isAccessError,
  };
}
