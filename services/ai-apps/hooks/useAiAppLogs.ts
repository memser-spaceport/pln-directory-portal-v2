'use client';

import { useQuery } from '@tanstack/react-query';

import { AiAppsQueryKeys } from '@/services/ai-apps/constants';
import { fetchAiAppLogs, AiAppLogStream, FetchAiAppLogsResult } from '@/services/ai-apps/ai-apps.service';

/**
 * Runtime is a continuous stream, so it gets a window; build logs are finite
 * per deploy and fetch unwindowed (the fetcher's own bounds still apply).
 */
const RUNTIME_WINDOW_MINUTES = 24 * 60;
export const RUNTIME_WINDOW_LABEL = 'last 24 hours';

/**
 * One stream's logs for the deployment-logs modal. No polling — data changes
 * only on open and on the modal's explicit Refresh (live tail is a v2 story).
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
  const { data, isLoading, isRefetching, isError, refetch } = useQuery<FetchAiAppLogsResult>({
    queryKey: [AiAppsQueryKeys.AI_APP_LOGS, uid, stream],
    queryFn: ({ signal }) =>
      fetchAiAppLogs(uid, stream, {
        signal,
        sinceMinutes: stream === 'runtime' ? RUNTIME_WINDOW_MINUTES : undefined,
      }),
    enabled: options.enabled,
    staleTime: 0,
    gcTime: 30_000,
    retry: 0,
    refetchOnWindowFocus: false,
  });

  return { result: data ?? null, isLoading, isRefetching, isError, refetch };
}
