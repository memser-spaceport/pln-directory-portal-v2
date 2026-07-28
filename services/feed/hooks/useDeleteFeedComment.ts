'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { IFeedCommentCountsResponse, IFeedCommentDeleteResponse, IFeedCommentsResponse } from '@/types/feed.types';
import { feedQueryKeys } from '../constants';
import { deleteFeedComment } from '../feed.service';

// Mirrors useAddFeedComment's shape exactly (same scope, same cancel-then-write
// ordering, same "cache writes live in options callbacks" rule) — delete is
// the inverse mutation over the same two cache entries. No optimistic
// pre-removal: the row shows a pending/disabled state during the request
// instead, same "nothing touches the cache until the server confirms" rule
// useAddFeedComment already follows.
export function useDeleteFeedComment(itemUid: string) {
  const queryClient = useQueryClient();

  return useMutation<IFeedCommentDeleteResponse, Error, { commentUid: string }>({
    scope: { id: `feed-comment-${itemUid}` },
    mutationFn: ({ commentUid }) => deleteFeedComment(commentUid),
    onSuccess: async (_, { commentUid }) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: feedQueryKeys.comments(itemUid) }),
        queryClient.cancelQueries({ queryKey: feedQueryKeys.commentCounts() }),
      ]);
      queryClient.setQueryData<IFeedCommentsResponse>(feedQueryKeys.comments(itemUid), (old) =>
        old ? { items: old.items.filter((c) => c.uid !== commentUid) } : old,
      );
      queryClient.setQueryData<IFeedCommentCountsResponse>(feedQueryKeys.commentCounts(), (old) =>
        old ? { ...old, [itemUid]: Math.max(0, (old[itemUid] ?? 0) - 1) } : old,
      );
    },
  });
}
