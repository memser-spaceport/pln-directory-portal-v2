'use client';

import { useEffect } from 'react';
import { skipToken, useQuery, useQueryClient } from '@tanstack/react-query';
import { isForumPostUid, type IFeedCommentCountsResponse, type IFeedCommentsResponse } from '@/types/feed.types';
import { feedQueryKeys } from '../constants';
import { writeCountFloor } from '../feedCommentCountFloor';

// A forum card's count starts out stale: it is built from NodeBB's /api/recent
// `postcount`, which can still be reporting the topic as it was before a reply
// landed. Opening the thread fetches the topic itself, and THAT knows — so this
// copies the topic's own reply count over the listing's guess, exactly as
// useFeedForumTopicLike copies the topic's vote state over /api/recent's blind
// `viewerHasLiked: false`.
//
// Not an approximation of the right number, but the number itself: the /forum
// post page renders `postcount - 1` from this same endpoint
// (components/page/forum/Post/Post.tsx), which is what "the newsfeed counter
// should equal the forum counter" is asking for.
//
// Authoritative in BOTH directions — it may lower the count, which is how a
// deleted comment recovers instead of leaving the badge permanently overstated.
// Safe to run on remount because the comment mutations keep `totalReplyCount`
// in step with their own writes, so re-applying it can't undo them.
export function useReconcileFeedCommentCount(itemUid: string) {
  const queryClient = useQueryClient();

  // skipToken = observe only. FeedCommentsThread owns the request; this reads
  // the entry it fills and narrows to one number, so a thread loading never
  // re-renders the feed.
  const { data: totalReplyCount } = useQuery<IFeedCommentsResponse, Error, number | undefined>({
    queryKey: feedQueryKeys.comments(itemUid),
    queryFn: skipToken,
    select: (response) => response.forumTopic?.totalReplyCount,
  });

  useEffect(() => {
    if (totalReplyCount === undefined || !isForumPostUid(itemUid)) return;

    writeCountFloor(itemUid, totalReplyCount);
    queryClient.setQueryData<IFeedCommentCountsResponse>(feedQueryKeys.commentCounts(), (old) =>
      // Returning `old` unchanged rather than an equal copy: this writes to the
      // cache on every settle, and an identical object would still notify.
      old?.[itemUid] === totalReplyCount ? old : { ...(old ?? {}), [itemUid]: totalReplyCount },
    );
  }, [itemUid, totalReplyCount, queryClient]);
}
