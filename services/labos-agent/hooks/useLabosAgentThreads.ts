'use client';

import {
  type InfiniteData,
  type QueryClient,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { useMemo } from 'react';

import { useCurrentUserStore } from '@/services/auth/store';
import type { LabosAgentThreadList, LabosAgentThreadListItem } from '@/types/labos-agent.types';

import { LABOS_AGENT_THREADS_PAGE_SIZE, LabosAgentQueryKeys } from '../constants';
import { LabosAgentError } from '../labos-agent.errors';
import { getLabosAgentHistoryClient } from '../labos-agent.history';

/*
 * LAB-3457: the React Query hooks of the shared history (T1, T2, T3, C5). The callers pass `enabled` only for a member
 * inside the agent gate (`useLabosAgentAccessState() === 'on'`): outside it the backend answers 403. The keys hold the
 * member uid, so a second member on the same browser never sees the first one's list.
 */

const notFound = (error: unknown) => error instanceof LabosAgentError && error.code === 'THREAD_NOT_FOUND';

/** The rows loaded so far, in order. A row that moved to a later page while paging shows once. */
export function threadRows(data: InfiniteData<LabosAgentThreadList> | undefined): LabosAgentThreadListItem[] {
  const seen = new Set<string>();
  return (data?.pages ?? []).flatMap((page) =>
    page.items.filter((item) => (seen.has(item.threadId) ? false : (seen.add(item.threadId), true))),
  );
}

/**
 * T1: the newest threads first, a page of `LABOS_AGENT_THREADS_PAGE_SIZE` at a time; `fetchNextPage` loads the next
 * one while `hasNextPage`. The rail searches and groups the loaded rows by date on the client.
 */
export function useLabosAgentThreads({ enabled }: { enabled: boolean }) {
  const uid = useCurrentUserStore((state) => state.currentUser?.uid);
  const query = useInfiniteQuery({
    queryKey: [LabosAgentQueryKeys.THREADS, uid],
    queryFn: ({ pageParam }) =>
      getLabosAgentHistoryClient().listThreads({ page: pageParam, limit: LABOS_AGENT_THREADS_PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam: (last, pages) => {
      const loaded = pages.reduce((n, page) => n + page.items.length, 0);
      return last.items.length > 0 && loaded < last.total ? last.page + 1 : undefined;
    },
    enabled: enabled && !!uid,
  });
  const rows = useMemo(() => threadRows(query.data), [query.data]);
  return { ...query, rows };
}

/** T2: one thread with its turns. A 404 (`THREAD_NOT_FOUND`) is final: no retry. */
export function useLabosAgentThread(threadId: string | null | undefined, { enabled }: { enabled: boolean }) {
  const uid = useCurrentUserStore((state) => state.currentUser?.uid);
  return useQuery({
    queryKey: [LabosAgentQueryKeys.THREAD, uid, threadId],
    queryFn: () => getLabosAgentHistoryClient().getThread(threadId as string),
    enabled: enabled && !!uid && !!threadId,
    retry: (count, error) => !notFound(error) && count < 2,
    // The turns of an open chat live in the chat store after the load; a refetch must not reset them.
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });
}

/**
 * After a saved turn or a C5 answer: the list order and titles change, and the cached thread is old. The list refetches
 * now; the thread is only marked stale, so an open chat keeps its store turns and the next open reads it again.
 */
export function refreshLabosAgentHistory(queryClient: QueryClient, threadId: string) {
  void queryClient.invalidateQueries({ queryKey: [LabosAgentQueryKeys.THREADS] });
  void queryClient.invalidateQueries({
    queryKey: [LabosAgentQueryKeys.THREAD],
    predicate: (q) => q.queryKey[2] === threadId,
    refetchType: 'none',
  });
}

/** T3. The row leaves the cached list at once; a 404 means it is gone already, so it leaves too. Then the list refetches. */
export function useDeleteLabosAgentThread() {
  const queryClient = useQueryClient();
  const drop = (threadId: string) => {
    queryClient.setQueriesData<InfiniteData<LabosAgentThreadList>>(
      { queryKey: [LabosAgentQueryKeys.THREADS] },
      (data) =>
        data
          ? {
              ...data,
              pages: data.pages.map((page) => ({
                ...page,
                total: Math.max(0, page.total - 1),
                items: page.items.filter((item) => item.threadId !== threadId),
              })),
            }
          : data,
    );
    queryClient.removeQueries({ queryKey: [LabosAgentQueryKeys.THREAD], predicate: (q) => q.queryKey[2] === threadId });
    // The server pages moved up by one row: read the loaded pages again, so "Load more" skips none.
    void queryClient.invalidateQueries({ queryKey: [LabosAgentQueryKeys.THREADS] });
  };
  return useMutation({
    mutationFn: async (threadId: string) => {
      try {
        await getLabosAgentHistoryClient().deleteThread(threadId);
      } catch (error) {
        if (!notFound(error)) throw error;
      }
      return threadId;
    },
    onSuccess: drop,
  });
}
