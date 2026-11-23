'use client';

import { InfiniteData, useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/components/core/ToastContainer';
import { feedbackApi } from './feedback.api';
import {
  CreateFeedbackInput,
  FeedbackItem,
  FeedbackListParams,
  FeedbackListResponse,
  FeedbackMe,
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

const VIEWER_SPECIFIC = { staleTime: 0, gcTime: 0, refetchOnWindowFocus: false } as const;

const ROADMAP_API_MAX_PER_COLUMN = 50;

type Page<T> = { items: T[]; next_cursor: string | null };
type ListPages = InfiniteData<FeedbackListResponse, string | undefined>;

function usePaged<T>(queryKey: unknown[], fetchPage: (cursor?: string) => Promise<Page<T>>, enabled = true) {
  const query = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam }) => fetchPage(pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.next_cursor ?? undefined,
    enabled,
    ...VIEWER_SPECIFIC,
  });

  return {
    data: query.data ? { items: query.data.pages.flatMap((page) => page.items) } : undefined,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
    hasMore: query.hasNextPage,
    isLoadingMore: query.isFetchingNextPage,
    loadMore: () => void query.fetchNextPage(),
  };
}

export function useFeedbackMe() {
  return useQuery({ queryKey: [FeedbackQueryKeys.ME], queryFn: feedbackApi.me, ...VIEWER_SPECIFIC, retry: 1 });
}

export function useFeedbackList(params: FeedbackListParams) {
  return usePaged([FeedbackQueryKeys.LIST, params], (cursor) => feedbackApi.list({ ...params, cursor }));
}

export function useFeedbackItem(id: string | undefined) {
  return useQuery({
    queryKey: [FeedbackQueryKeys.ITEM, id],
    queryFn: () => feedbackApi.item(id as string),
    enabled: Boolean(id),
    ...VIEWER_SPECIFIC,
  });
}

export function useFeedbackRoadmap(perColumn = ROADMAP_API_MAX_PER_COLUMN) {
  return useQuery({
    queryKey: [FeedbackQueryKeys.ROADMAP, perColumn],
    queryFn: () => feedbackApi.roadmap(perColumn),
    ...VIEWER_SPECIFIC,
  });
}

export function useFeedbackTriage(enabled: boolean) {
  return usePaged([FeedbackQueryKeys.TRIAGE], (cursor) => feedbackApi.triage(cursor), enabled);
}

export function useFeedbackComments(id: string | undefined) {
  return usePaged(
    [FeedbackQueryKeys.COMMENTS, id],
    (cursor) => feedbackApi.comments(id as string, cursor),
    Boolean(id),
  );
}

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
    onSuccess: () => {
      toast.success('Feedback submitted. Thank you.');
      invalidate();
    },
  });
}

export function useVote() {
  const queryClient = useQueryClient();
  const invalidate = useInvalidateBoard();

  return useMutation({
    mutationFn: ({ id, voted }: { id: string; voted: boolean }) =>
      voted ? feedbackApi.removeVote(id) : feedbackApi.addVote(id),

    onMutate: async ({ id, voted }) => {
      await queryClient.cancelQueries({ queryKey: [FeedbackQueryKeys.LIST] });
      await queryClient.cancelQueries({ queryKey: [FeedbackQueryKeys.ITEM, id] });
      await queryClient.cancelQueries({ queryKey: [FeedbackQueryKeys.ME] });

      const previousLists = queryClient.getQueriesData<ListPages>({ queryKey: [FeedbackQueryKeys.LIST] });
      const previousItem = queryClient.getQueryData<FeedbackItem>([FeedbackQueryKeys.ITEM, id]);
      const previousMe = queryClient.getQueryData<FeedbackMe>([FeedbackQueryKeys.ME]);
      const delta = voted ? -1 : 1;

      queryClient.setQueryData<FeedbackMe>([FeedbackQueryKeys.ME], (old) =>
        old
          ? {
              ...old,
              vote_budget: {
                ...old.vote_budget,
                used: Math.max(0, old.vote_budget.used + delta),
                remaining: Math.max(0, old.vote_budget.remaining - delta),
              },
            }
          : old,
      );

      const patch = (item: FeedbackItem): FeedbackItem =>
        item.id === id ? { ...item, has_voted: !voted, vote_count: item.vote_count + delta } : item;

      queryClient.setQueriesData<ListPages>({ queryKey: [FeedbackQueryKeys.LIST] }, (old) =>
        old ? { ...old, pages: old.pages.map((page) => ({ ...page, items: page.items.map(patch) })) } : old,
      );
      queryClient.setQueryData<FeedbackItem>([FeedbackQueryKeys.ITEM, id], (old) => (old ? patch(old) : old));

      return { previousLists, previousItem, previousMe, id };
    },

    onError: (error, _variables, context) => {
      toast.error(error instanceof Error && error.message ? error.message : 'Your vote was not saved. Try again.');
      context?.previousLists?.forEach(([key, data]) => queryClient.setQueryData(key, data));
      if (context?.previousItem) {
        queryClient.setQueryData([FeedbackQueryKeys.ITEM, context.id], context.previousItem);
      }
      if (context?.previousMe) {
        queryClient.setQueryData([FeedbackQueryKeys.ME], context.previousMe);
      }
    },

    onSuccess: (data) => {
      queryClient.setQueryData<FeedbackMe>([FeedbackQueryKeys.ME], (old) =>
        old ? { ...old, vote_budget: data.budget } : old,
      );
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
    onError: (error) =>
      toast.error(error instanceof Error && error.message ? error.message : 'That change was not saved. Try again.'),
  });
}

export function useRetryLinear() {
  const invalidate = useInvalidateBoard();
  return useMutation({
    mutationFn: (id: string) => feedbackApi.retryLinear(id),
    onSuccess: (_data, id) => invalidate(id),
  });
}
