'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { IFeedComment, IFeedCommentCountsResponse, IFeedCommentsResponse } from '@/types/feed.types';
import { insertCommentIntoTree } from '@/utils/comments';
import { useTeamNewsAnalytics, type FeedItemKind, type TeamNewsAnalyticsSource } from '@/analytics/team-news.analytics';
import { feedQueryKeys } from '../constants';
import { classifyCommentFailure } from '../commentFailure';
import { createFeedComment } from '../feed.service';

/** Which surface a write came from, so its analytics can say. */
export interface FeedCommentContext {
  kind: FeedItemKind;
  source: TeamNewsAnalyticsSource;
}

/** Mentions are the only thing in a comment worth counting, and the class
 *  MentionBlot stamps is what distinguishes one from an ordinary link. */
function countMentions(html: string): number {
  return html.match(/class="ql-mention"/g)?.length ?? 0;
}

// Per-item mutation (itemUid bound at hook creation so `scope` can serialize
// rapid submits across surfaces — the card composer and the modal composer are
// separate mutation instances over the same item).
//
// All cache writes live in the useMutation OPTIONS callbacks: options callbacks
// survive component unmount (a tab switch remounts the card mid-flight and
// must not drop the write); `mutate()`-level callbacks would not.
//
// While the submit is in flight, the composer renders the pending comment from
// `variables` (the "optimistic via UI" pattern) — nothing touches the cache
// until the server confirms, so there is no rollback path to get wrong. No
// invalidateQueries here (or in the like toggle): a refetch racing the patch
// is the "comment that vanishes" bug; if the real-API swap ever adds an
// onSettled invalidation, guard it with isMutating({scope}) === 1.
// `forumMainPid` is the topic's opening post, which a top-level comment on a
// forum post replies to. Passed in by the surface that already has the post so
// the write costs one request; ignored entirely for news items.
export function useAddFeedComment(itemUid: string, forumMainPid?: number, context?: FeedCommentContext) {
  const queryClient = useQueryClient();
  const analytics = useTeamNewsAnalytics();

  return useMutation<IFeedComment, Error, { text: string; parentUid?: string }>({
    scope: { id: `feed-comment-${itemUid}` },
    mutationFn: ({ text, parentUid }) => createFeedComment({ itemUid, parentUid, text, forumMainPid }),
    // Analytics live here with the cache writes, for the same reason: a tab or
    // category change remounts the card mid-flight, and a mutate()-level
    // callback would simply not run. Submitted used to be reported from the
    // component and was therefore already silently lossy — putting the failure
    // event anywhere else would make the failure RATE wrong, in a direction
    // nobody could work out from the data.
    onError: (error, { parentUid }) => {
      if (!context) return;
      // `parentUid` comes from the mutation's own variables, never component
      // state: the member can close a reply composer while the write is in
      // flight, and `replyingTo` would then describe the wrong thing.
      analytics.onFeedCommentFailed(
        itemUid,
        context.kind,
        context.source,
        Boolean(parentUid),
        classifyCommentFailure(error),
      );
    },
    onSuccess: async (created, { text, parentUid }) => {
      if (context) {
        analytics.onFeedCommentSubmitted(
          itemUid,
          context.kind,
          context.source,
          Boolean(parentUid),
          countMentions(text),
        );
      }
      // Cancel BEFORE writing — an in-flight thread/counts refetch whose server
      // snapshot predates this POST would clobber the append when it lands.
      await Promise.all([
        queryClient.cancelQueries({ queryKey: feedQueryKeys.comments(itemUid) }),
        queryClient.cancelQueries({ queryKey: feedQueryKeys.commentCounts() }),
      ]);
      // Comments are oldest-first, so a fresh one belongs at the END of its
      // level — and a REPLY belongs under its parent at any depth, not appended
      // to the root list (which would silently promote it to a top-level
      // comment until the next refetch).
      //
      // Spread `old`: the entry also carries `forumTopic` (the NodeBB topic's
      // url / totalReplyCount / like state). Rebuilding the object from `items`
      // alone erased it on the first post, which silently took out the "N more
      // comments on the forum" link, the escalation label's honesty about
      // unloaded replies, and useFeedForumTopicLike's view of the vote state.
      queryClient.setQueryData<IFeedCommentsResponse>(feedQueryKeys.comments(itemUid), (old) =>
        old ? { ...old, items: insertCommentIntoTree(old.items, created) } : { items: [created] },
      );
      queryClient.setQueryData<IFeedCommentCountsResponse>(feedQueryKeys.commentCounts(), (old) =>
        old ? { ...old, [itemUid]: (old[itemUid] ?? 0) + 1 } : { [itemUid]: 1 },
      );
    },
  });
}
