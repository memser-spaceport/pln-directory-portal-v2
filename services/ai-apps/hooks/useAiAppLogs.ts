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
 * One stream's logs for the deployment-logs modal, requested with
 * `order=desc`: page 1 is the log's true tail (the web-api assembles the
 * newest-first view — the runner itself only pages forward) and each
 * `loadMore` walks EARLIER into history via the server's offset cursor.
 * `hasMore` doubles as the "history continues" signal.
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

  // Newest-first across ALL loaded pages. With order=desc, later pages are
  // strictly older, so the global re-sort is a cheap idempotent safety net.
  // The dedupe guards against cursor drift: the server's offset cursor is
  // relative to the newest line, so lines arriving between two page requests
  // (after its 15s walk cache expires) can shift the window and repeat a line.
  const events = useMemo<AiAppLogEvent[] | null>(() => {
    if (!query.data) return null;
    const seen = new Set<string>();
    return query.data.pages
      .flatMap((page) => page.events)
      .filter((event) => {
        const key = `${event.timestamp}|${event.message}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
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
