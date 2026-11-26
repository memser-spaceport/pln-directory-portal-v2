'use client';

import { type QueryClient, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useCurrentUserStore } from '@/services/auth/store';
import type { LabosAgentDraftConfirmRequest, LabosAgentThread, LabosAgentThreadList } from '@/types/labos-agent.types';

import { LABOS_AGENT_THREADS_PAGE_SIZE, LabosAgentQueryKeys } from '../constants';
import { LabosAgentError } from '../labos-agent.errors';
import { getLabosAgentHistoryClient } from '../labos-agent.history';

/*
 * LAB-3457: the React Query hooks of the shared history (T1, T2, T3, C5). The callers pass `enabled` only for a member
 * inside the agent gate (`useLabosAgentAccessState() === 'on'`): outside it the backend answers 403. The keys hold the
 * member uid, so a second member on the same browser never sees the first one's list.
 */

const notFound = (error: unknown) => error instanceof LabosAgentError && error.code === 'THREAD_NOT_FOUND';

/** T1: the newest threads first, one page of 50. The rail searches and groups them by date on the client. */
export function useLabosAgentThreads({ enabled }: { enabled: boolean }) {
  const uid = useCurrentUserStore((state) => state.currentUser?.uid);
  return useQuery({
    queryKey: [LabosAgentQueryKeys.THREADS, uid],
    queryFn: () => getLabosAgentHistoryClient().listThreads({ page: 1, limit: LABOS_AGENT_THREADS_PAGE_SIZE }),
    enabled: enabled && !!uid,
  });
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

/** After a saved turn: the list order and titles change. */
export function invalidateLabosAgentThreads(queryClient: QueryClient) {
  return queryClient.invalidateQueries({ queryKey: [LabosAgentQueryKeys.THREADS] });
}

/** T3. The row leaves the cached list at once; a 404 means it is gone already, so it leaves too. */
export function useDeleteLabosAgentThread() {
  const queryClient = useQueryClient();
  const drop = (threadId: string) => {
    queryClient.setQueriesData<LabosAgentThreadList>({ queryKey: [LabosAgentQueryKeys.THREADS] }, (list) =>
      list
        ? {
            ...list,
            total: Math.max(0, list.total - 1),
            items: list.items.filter((item) => item.threadId !== threadId),
          }
        : list,
    );
    queryClient.removeQueries({ queryKey: [LabosAgentQueryKeys.THREAD], predicate: (q) => q.queryKey[2] === threadId });
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

/** C5. The cached thread gets the draft's new state, so a reopened chat shows it sent or cancelled. */
export function useConfirmLabosAgentDraft() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: LabosAgentDraftConfirmRequest) => getLabosAgentHistoryClient().confirmDraft(request),
    onSuccess: (response, request) => {
      queryClient.setQueriesData<LabosAgentThread>(
        { queryKey: [LabosAgentQueryKeys.THREAD], predicate: (q) => q.queryKey[2] === request.threadId },
        (thread) =>
          thread && {
            ...thread,
            turns: thread.turns.map((turn) =>
              turn.kind !== 'agent'
                ? turn
                : {
                    ...turn,
                    drafts: turn.drafts.map((draft) =>
                      draft.draftId !== response.draftId
                        ? draft
                        : {
                            ...draft,
                            status: response.status,
                            ...(response.status === 'sent' && request.text ? { text: request.text.trim() } : {}),
                            ...(response.introRequestUid ? { introRequestUid: response.introRequestUid } : {}),
                          },
                    ),
                  },
            ),
          },
      );
    },
  });
}
