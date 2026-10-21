'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { feedbackApi } from './feedback.api';
import {
  CreateFeedbackInput,
  FeedbackItem,
  FeedbackListParams,
  FeedbackListResponse,
  FeedbackStatus,
  FeedbackType,
} from './feedback.types';

export const FeedbackQueryKeys = {
  ME: 'plaa-feedback-me',
  LIST: 'plaa-feedback-list',
  ITEM: 'plaa-feedback-item',
  ROADMAP: 'plaa-feedback-roadmap',
  TRIAGE: 'plaa-feedback-triage',
  COMMENTS: 'plaa-feedback-comments',
} as const;

/**
 * Viewer-specific reads are never cached across members: staleTime 0 plus the
 * proxy's `private, no-store` means member B can't be served A's board.
 */
const VIEWER_SPECIFIC = { staleTime: 0, gcTime: 0, refetchOnWindowFocus: false } as const;

export function useFeedbackMe() {
  return useQuery({ queryKey: [FeedbackQueryKeys.ME], queryFn: feedbackApi.me, ...VIEWER_SPECIFIC, retry: 1 });
}

export function useFeedbackList(params: FeedbackListParams) {
  return useQuery({
    queryKey: [FeedbackQueryKeys.LIST, params],
    queryFn: () => feedbackApi.list(params),
    ...VIEWER_SPECIFIC,
  });
}

export function useFeedbackItem(id: string | undefined) {
  return useQuery({
    queryKey: [FeedbackQueryKeys.ITEM, id],
    queryFn: () => feedbackApi.item(id as string),
    enabled: Boolean(id),
    ...VIEWER_SPECIFIC,
  });
}

export function useFeedbackRoadmap(perColumn = 20) {
  return useQuery({
    queryKey: [FeedbackQueryKeys.ROADMAP, perColumn],
    queryFn: () => feedbackApi.roadmap(perColumn),
    ...VIEWER_SPECIFIC,
  });
}

export function useFeedbackTriage(enabled: boolean) {
  return useQuery({
    queryKey: [FeedbackQueryKeys.TRIAGE],
    queryFn: () => feedbackApi.triage(),
    enabled,
    ...VIEWER_SPECIFIC,
  });
}

export function useFeedbackComments(id: string | undefined) {
  return useQuery({
    queryKey: [FeedbackQueryKeys.COMMENTS, id],
    queryFn: () => feedbackApi.comments(id as string),
    enabled: Boolean(id),
    ...VIEWER_SPECIFIC,
  });
}

/** Everything a mutation can stale: list, roadmap, triage and the item itself. */
function useInvalidateBoard() {
  const queryClient = useQueryClient();
  return (id?: string) => {
    void queryClient.invalidateQueries({ queryKey: [FeedbackQueryKeys.LIST] });
    void queryClient.invalidateQueries({ queryKey: [FeedbackQueryKeys.ROADMAP] });
    void queryClient.invalidateQueries({ queryKey: [FeedbackQueryKeys.TRIAGE] });
    if (id) void queryClient.invalidateQueries({ queryKey: [FeedbackQueryKeys.ITEM, id] });
  };
}

export function useCreateFeedback() {
  const invalidate = useInvalidateBoard();
  return useMutation({
    mutationFn: (input: CreateFeedbackInput) => feedbackApi.create(input),
    onSuccess: () => invalidate(),
  });
}

/**
 * Optimistic vote with rollback (AC-T4.2). The cached list and item are patched
 * before the request so the count moves on click; a failure puts the previous
 * snapshots back exactly.
 */
export function useVote() {
  const queryClient = useQueryClient();
  const invalidate = useInvalidateBoard();

  return useMutation({
    mutationFn: ({ id, voted }: { id: string; voted: boolean }) =>
      voted ? feedbackApi.removeVote(id) : feedbackApi.addVote(id),

    onMutate: async ({ id, voted }) => {
      await queryClient.cancelQueries({ queryKey: [FeedbackQueryKeys.LIST] });
      await queryClient.cancelQueries({ queryKey: [FeedbackQueryKeys.ITEM, id] });

      const previousLists = queryClient.getQueriesData<FeedbackListResponse>({ queryKey: [FeedbackQueryKeys.LIST] });
      const previousItem = queryClient.getQueryData<FeedbackItem>([FeedbackQueryKeys.ITEM, id]);
      const delta = voted ? -1 : 1;

      const patch = (item: FeedbackItem): FeedbackItem =>
        item.id === id ? { ...item, has_voted: !voted, vote_count: item.vote_count + delta } : item;

      queryClient.setQueriesData<FeedbackListResponse>({ queryKey: [FeedbackQueryKeys.LIST] }, (old) =>
        old ? { ...old, items: old.items.map(patch) } : old,
      );
      queryClient.setQueryData<FeedbackItem>([FeedbackQueryKeys.ITEM, id], (old) => (old ? patch(old) : old));

      return { previousLists, previousItem, id };
    },

    onError: (_error, _variables, context) => {
      context?.previousLists?.forEach(([key, data]) => queryClient.setQueryData(key, data));
      if (context?.previousItem) {
        queryClient.setQueryData([FeedbackQueryKeys.ITEM, context.id], context.previousItem);
      }
    },

    onSettled: (_data, _error, variables) => invalidate(variables.id),
  });
}

export function useAddComment(itemId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: string) => feedbackApi.addComment(itemId, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [FeedbackQueryKeys.COMMENTS, itemId] });
      void queryClient.invalidateQueries({ queryKey: [FeedbackQueryKeys.ITEM, itemId] });
    },
  });
}

export function useDeleteComment(itemId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (commentId: string) => feedbackApi.deleteComment(commentId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [FeedbackQueryKeys.COMMENTS, itemId] }),
  });
}

export function useHideComment(itemId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ commentId, hidden }: { commentId: string; hidden: boolean }) =>
      feedbackApi.hideComment(commentId, hidden),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [FeedbackQueryKeys.COMMENTS, itemId] }),
  });
}

export function useChangeStatus() {
  const invalidate = useInvalidateBoard();
  return useMutation({
    mutationFn: ({
      id,
      toStatus,
      note,
      duplicateOfId,
    }: {
      id: string;
      toStatus: FeedbackStatus;
      note?: string;
      duplicateOfId?: string;
    }) => feedbackApi.changeStatus(id, toStatus, note, duplicateOfId),
    onSuccess: (_data, variables) => invalidate(variables.id),
  });
}

export function useAdminUpdate() {
  const invalidate = useInvalidateBoard();
  return useMutation({
    mutationFn: ({
      id,
      ...body
    }: {
      id: string;
      type?: FeedbackType;
      title?: string;
      is_public?: boolean;
      removed?: boolean;
    }) => feedbackApi.adminUpdate(id, body),
    onSuccess: (_data, variables) => invalidate(variables.id),
  });
}

export function useRetryLinear() {
  const invalidate = useInvalidateBoard();
  return useMutation({
    mutationFn: (id: string) => feedbackApi.retryLinear(id),
    onSuccess: (_data, id) => invalidate(id),
  });
}
