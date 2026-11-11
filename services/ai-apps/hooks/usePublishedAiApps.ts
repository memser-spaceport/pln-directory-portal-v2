'use client';

import { useQuery } from '@tanstack/react-query';

import { useCurrentUserStore } from '@/services/auth/store';
import { AiAppsQueryKeys } from '@/services/ai-apps/constants';
import { fetchPublishedAiApps, PublishedAiApp } from '@/services/ai-apps/ai-apps.service';

const EMPTY: PublishedAiApp[] = [];

/**
 * AI Apps published to the signed-in member (LAB-3200). Needs no `ai_apps.read`
 * and must never be put behind it. The nav asks on every page, so a failure
 * reads as "none" rather than an error; signed out, nothing is requested.
 */
export function usePublishedAiApps() {
  const { currentUser, isHydrated } = useCurrentUserStore();

  const { data, isPending } = useQuery<PublishedAiApp[]>({
    queryKey: [AiAppsQueryKeys.AI_APPS_PUBLISHED, currentUser?.uid],
    queryFn: fetchPublishedAiApps,
    staleTime: 5 * 60 * 1000,
    enabled: !!currentUser,
    retry: 1,
  });

  return {
    apps: Array.isArray(data) ? data : EMPTY,
    // Only the first fetch counts: a background refetch must not swap an open app for a loading state.
    isLoading: !isHydrated || (!!currentUser && isPending),
  };
}
