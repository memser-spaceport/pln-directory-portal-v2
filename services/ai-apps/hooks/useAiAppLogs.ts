'use client';

import { useMemo } from 'react';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';

import { AiAppsQueryKeys } from '@/services/ai-apps/constants';
import { logTimestampSortValue } from '@/services/ai-apps/ai-apps-logs.utils';
import {
  fetchAiAppLogsPage,
  AiAppFetchErrorKind,
  AiAppLogEvent,
  AiAppLogsError,
  AiAppLogsPage,
  AiAppLogStream,
} from '@/services/ai-apps/ai-apps.service';

/**
 * Runtime is a continuous stream, so it gets a window; build logs are finite
 * per deploy and fetch unwindowed (the fetcher's own bounds still apply).
 */
const RUNTIME_WINDOW_MINUTES = 24 * 60;
export const RUNTIME_WINDOW_LABEL = 'last 24 hours';

/**
 * One stream's logs for the deployment-logs modal, paged by the runner's
 * `nextToken`: the first page loads on open, further pages load via the
 * modal's explicit "Load newer logs" button (`loadMore` — MANUAL by design:
 * the runner pages forward, so appended lines sort in above the reader and
 * every scroll-based auto-load heuristic turns into a request loop). `hasMore`
 * doubles as the "log continues" signal.
 *
 * The modal must be conditionally rendered (`action && <Modal/>`), never kept
 * mounted behind an isOpen prop: abort-on-close works because unmounting drops
 * the query's last observer while the queryFn consumes the signal. `enabled:
 * false` alone never cancels an in-flight fetch.
 *
 * staleTime 0 → every open refetches (also the safety net for redeploys
 * triggered outside this tab, e.g. by the agent). gcTime is short and only
 * controls whether a quick reopen flashes the previous snapshot while the
 * refetch runs — accepted. retry 0: a retry would hit the CloudWatch proxy
 * exactly when the runner is unhealthy, and the user has Refresh.
 */
export function useAiAppLogs(uid: string, stream: AiAppLogStream, options: { enabled: boolean }) {
  const queryClient = useQueryClient();
  const queryKey = [AiAppsQueryKeys.AI_APP_LOGS, uid, stream];

  const query = useInfiniteQuery<AiAppLogsPage, Error>({
    queryKey,
    initialPageParam: undefined as string | undefined,
    queryFn: ({ signal, pageParam }) =>
      fetchAiAppLogsPage(uid, stream, {
        signal,
        nextToken: pageParam as string | undefined,
        sinceMinutes: stream === 'runtime' ? RUNTIME_WINDOW_MINUTES : undefined,
      }),
    getNextPageParam: (lastPage) => lastPage.nextToken,
    enabled: options.enabled,
    staleTime: 0,
    gcTime: 30_000,
    retry: 0,
    refetchOnWindowFocus: false,
  });

  // Newest-first across ALL loaded pages. Each page arrives pre-sorted; the
  // global re-sort is a cheap idempotent no-op when the runner reads from the
  // tail (CloudWatch GetLogEvents' default — later pages are strictly older),
  // and it keeps the display coherent if the runner turns out to page forward
  // instead (the open ordering question with backend).
  const events = useMemo<AiAppLogEvent[] | null>(() => {
    if (!query.data) return null;
    return query.data.pages
      .flatMap((page) => page.events)
      .sort((a, b) => logTimestampSortValue(b.timestamp) - logTimestampSortValue(a.timestamp));
  }, [query.data]);

  const pages = query.data?.pages;

  return {
    events,
    pageCount: pages?.length ?? 0,
    /** Set only when the query has no data at all — the whole-body error states. */
    errorKind:
      !query.data && query.isError
        ? query.error instanceof AiAppLogsError
          ? query.error.errorKind
          : ('network' as AiAppFetchErrorKind)
        : null,
    /** A later page failed while earlier pages render — inline retry, not a blank body. */
    loadMoreFailed: !!query.data && query.isError,
    isLoading: query.isLoading,
    hasMore: !!query.hasNextPage,
    isLoadingMore: query.isFetchingNextPage,
    loadMore: () => {
      if (query.hasNextPage && !query.isFetchingNextPage) void query.fetchNextPage();
    },
    /** Refresh = start over from page 1 (a plain refetch would replay every loaded page). */
    refresh: () => queryClient.resetQueries({ queryKey }),
  };
}
