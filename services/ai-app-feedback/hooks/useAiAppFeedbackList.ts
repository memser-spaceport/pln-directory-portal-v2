'use client';

import { useQueries, useQuery } from '@tanstack/react-query';
import { AiAppFeedbackQueryKeys } from '@/services/ai-app-feedback/constants';
import { AccessControlQueryKeys } from '@/services/access-control/constants';
import { fetchMyAccess } from '@/services/access-control/access-control.service';
import { fetchAiAppFeedbackForApp, AiAppFeedback } from '@/services/ai-app-feedback/ai-app-feedback.service';
import { useAiApps } from '@/services/ai-apps/hooks/useAiApps';
import { useCurrentUserStore } from '@/services/auth/store';

export interface AiAppFeedbackRow extends AiAppFeedback {
  appName: string;
}

/**
 * There is no global "list all reviewable feedback" endpoint - GET
 * /v1/ai-apps/:uid/feedback is per-app and 403s server-side for anyone but that
 * app's creator or a directory admin. This fans a query out across every app the
 * viewer might be able to review and merges the results, tagging each row with
 * the app's name (the endpoint itself doesn't return one).
 *
 * The isDirectoryAdmin check here mirrors useAiAppFeedbackReviewAccess but the
 * backend's own admin check for this endpoint (isDirectoryAdmin() in
 * ai-apps.service.ts) is role-based (legacy memberRoles), not this
 * directory.admin.full permission - a mismatch there just drops that app's fetch
 * (403 -> empty array) rather than breaking the page.
 */
export function useAiAppFeedbackList() {
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

  const candidateApps = isDirectoryAdmin ? apps : apps.filter((app) => app.member.uid === currentUser?.uid);

  const feedbackQueries = useQueries({
    queries: candidateApps.map((app) => ({
      queryKey: [AiAppFeedbackQueryKeys.AI_APP_FEEDBACK_LIST, app.uid],
      queryFn: () => fetchAiAppFeedbackForApp(app.uid),
      staleTime: 5 * 60 * 1000,
      retry: 2,
    })),
  });

  const feedback: AiAppFeedbackRow[] = candidateApps
    .flatMap((app, index) => (feedbackQueries[index]?.data ?? []).map((row) => ({ ...row, appName: app.name })))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return {
    feedback,
    isLoading: isAppsLoading || isAccessLoading || feedbackQueries.some((q) => q.isLoading),
    isError: isAppsError || isAccessError,
  };
}
