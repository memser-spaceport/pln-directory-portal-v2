'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { IFeedCommentCountsResponse, IFeedCommentDeleteResponse, IFeedCommentsResponse } from '@/types/feed.types';
import { removeCommentFromTree } from '@/utils/comments';
import { useTeamNewsAnalytics } from '@/analytics/team-news.analytics';
import { feedQueryKeys } from '../constants';
import { classifyCommentFailure } from '../commentFailure';
import { deleteFeedComment } from '../feed.service';
import type { FeedCommentContext } from './useAddFeedComment';

// Mirrors useAddFeedComment's shape exactly (same scope, same cancel-then-write
// ordering, same "cache writes live in options callbacks" rule) — delete is
// the inverse mutation over the same two cache entries. No optimistic
// pre-removal: the row shows a pending/disabled state during the request
// instead, same "nothing touches the cache until the server confirms" rule
// useAddFeedComment already follows.
export function useDeleteFeedComment(itemUid: string, context?: FeedCommentContext) {
  const queryClient = useQueryClient();
  const analytics = useTeamNewsAnalytics();

  return useMutation<IFeedCommentDeleteResponse, Error, { commentUid: string }>({
    scope: { id: `feed-comment-${itemUid}` },
    mutationFn: ({ commentUid }) => deleteFeedComment(commentUid),
    // Same reasoning as useAddFeedComment: reported here so a remount can't
    // swallow it, and so `removedCount` — which only this callback knows — can
    // ride along.
    onError: (error) => {
      if (!context) return;
      analytics.onFeedCommentDeleteFailed(itemUid, context.kind, context.source, classifyCommentFailure(error));
    },
    onSuccess: async (_, { commentUid }) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: feedQueryKeys.comments(itemUid) }),
        queryClient.cancelQueries({ queryKey: feedQueryKeys.commentCounts() }),
      ]);
      // The backend cascades: deleting a comment deletes its replies too. So the
      // whole subtree comes out of the thread, and the count drops by its size —
      // decrementing by 1 would leave the badge permanently overstated.
      // `removedCount` is 0 when the comment wasn't cached (a stale delete from
      // another tab), which correctly leaves the count alone.
      const cached = queryClient.getQueryData<IFeedCommentsResponse>(feedQueryKeys.comments(itemUid));
      const { items, removedCount } = cached
        ? removeCommentFromTree(cached.items, commentUid)
        : { items: [], removedCount: 0 };

      // Spread `cached` for the same reason useAddFeedComment spreads `old`:
      // `forumTopic` rides on this entry and must survive the patch.
      if (cached)
        queryClient.setQueryData<IFeedCommentsResponse>(feedQueryKeys.comments(itemUid), { ...cached, items });
      if (removedCount > 0) {
        queryClient.setQueryData<IFeedCommentCountsResponse>(feedQueryKeys.commentCounts(), (old) =>
          old ? { ...old, [itemUid]: Math.max(0, (old[itemUid] ?? 0) - removedCount) } : old,
        );
      }

      // `removedCount` is 0 for a comment that wasn't cached — a stale delete
      // from another tab, which the service maps 404→success. Reporting it
      // keeps that case visible instead of inflating the delete count.
      if (context) analytics.onFeedCommentDeleted(itemUid, context.kind, context.source, removedCount);
    },
  });
}
