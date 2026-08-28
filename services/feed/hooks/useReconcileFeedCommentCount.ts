'use client';

import { useEffect } from 'react';
import { skipToken, useQuery, useQueryClient } from '@tanstack/react-query';
import { countComments } from '@/utils/comments';
import { isForumPostUid, type IFeedCommentCountsResponse, type IFeedCommentsResponse } from '@/types/feed.types';
import { feedQueryKeys } from '../constants';
import { writeCountFloor } from '../feedCommentCountFloor';

// A feed card's count is whatever the listing said when the page loaded.
// Opening a thread fetches the item itself, and THAT knows — so this copies the
// thread's own number over the listing's guess, exactly as useFeedForumTopicLike
// copies the topic's vote state over /api/recent's blind `viewerHasLiked: false`.
//
// Where the right number lives differs by source:
//
//   forum post — the topic's `totalReplyCount`. NodeBB serves one page of posts
//     per request, so the replies that arrived are a subset and counting them
//     would understate. The /forum post page renders `postcount - 1` from this
//     same endpoint (components/page/forum/Post/Post.tsx), which is what "the
//     newsfeed counter should equal the forum counter" is asking for.
//
//   news item — the loaded tree itself. `listComments` is an unpaginated
//     findMany over the same table the counts endpoint aggregates with
//     `groupBy`, so the tree IS the count rather than a sample of it.
//
// News used to be skipped here, on the grounds that its count is
// server-authoritative. It is — but the counts entry is fetched once per session
// and then held at `staleTime: Infinity`, so it is the STALE one the moment
// anybody else comments; the thread is what just came off the wire. Skipping
// news also let the detail modal's header (which derives its number from the
// thread) sit above a card badge quietly disagreeing with it.
//
// Authoritative in BOTH directions — it may lower the count, which is how a
// deleted comment recovers instead of leaving the badge permanently overstated.
// Safe to run on remount because the comment mutations write the tree and the
// count in the same callback, so re-applying what the tree says can't undo them.
export function useReconcileFeedCommentCount(itemUid: string) {
  const queryClient = useQueryClient();
  const isForumPost = isForumPostUid(itemUid);

  // skipToken = observe only. FeedCommentsThread owns the request; this reads
  // the entry it fills and narrows to one number, so a thread loading never
  // re-renders the feed.
  const { data: authoritativeCount } = useQuery<IFeedCommentsResponse, Error, number | undefined>({
    queryKey: feedQueryKeys.comments(itemUid),
    queryFn: skipToken,
    select: (response) =>
      isForumPost
        ? response.forumTopic?.totalReplyCount
        : // Array-checked rather than defaulted to []: a cache entry without
          // items is a partial write, not an empty thread, and reconciling it
          // would report every comment on the item as deleted.
          Array.isArray(response.items)
          ? countComments(response.items)
          : undefined,
  });

  useEffect(() => {
    if (authoritativeCount === undefined) return;

    // No-op for a news uid, by the floor module's own rule: the floor exists to
    // outlast NodeBB's stale listing, and news has no such staleness to survive.
    writeCountFloor(itemUid, authoritativeCount);
    queryClient.setQueryData<IFeedCommentCountsResponse>(feedQueryKeys.commentCounts(), (old) =>
      // Returning `old` unchanged rather than an equal copy: this writes to the
      // cache on every settle, and an identical object would still notify.
      old?.[itemUid] === authoritativeCount ? old : { ...(old ?? {}), [itemUid]: authoritativeCount },
    );
  }, [itemUid, authoritativeCount, queryClient]);
}
