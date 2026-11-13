'use client';

import { useQuery } from '@tanstack/react-query';

import { useCurrentUserStore } from '@/services/auth/store';
import { AiAppsQueryKeys, PUBLISHED_AI_APPS_STALE_TIME_MS } from '@/services/ai-apps/constants';
import { fetchPublishedAiApps, PublishedAiApp } from '@/services/ai-apps/ai-apps.service';

const EMPTY: PublishedAiApp[] = [];

interface Options {
  /**
   * Wait for a list fetched after this mount instead of trusting the cache.
   * The page that frames the app sets it, so an app taken back since the menu
   * last loaded reads as "not available" rather than opening from a stale list.
   */
  fresh?: boolean;
}

/**
 * AI Apps published to the signed-in member (LAB-3200). Needs no `ai_apps.read`
 * and must never be put behind it. The nav asks on every page, so a failure
 * reads as "none" rather than an error; signed out, nothing is requested.
 *
 * An admin can take an app back, or remove a member's policy, at any time, so
 * the list goes stale quickly and is fetched again when the member comes back
 * to the tab. Only the first fetch shows as loading, so a background refetch
 * never swaps the menu or an open app for a loading state.
 */
export function usePublishedAiApps({ fresh = false }: Options = {}) {
  const { currentUser, isHydrated } = useCurrentUserStore();

  const { data, isPending, isFetchedAfterMount } = useQuery<PublishedAiApp[]>({
    queryKey: [AiAppsQueryKeys.AI_APPS_PUBLISHED, currentUser?.uid],
    queryFn: fetchPublishedAiApps,
    staleTime: PUBLISHED_AI_APPS_STALE_TIME_MS,
    refetchOnWindowFocus: true,
    refetchOnMount: fresh ? 'always' : true,
    enabled: !!currentUser,
    retry: 1,
  });

  const waiting = isPending || (fresh && !isFetchedAfterMount);

  return {
    apps: Array.isArray(data) ? data : EMPTY,
    isLoading: !isHydrated || (!!currentUser && waiting),
  };
}
