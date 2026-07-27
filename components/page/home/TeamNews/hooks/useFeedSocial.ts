'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { IFeedCommentCountsResponse, IFeedForumPost } from '@/types/feed.types';
import { FEED_SOCIAL_ENABLED } from '@/utils/feature-flags';
import { useCurrentUserStore } from '@/services/auth/store';
import { useForumAccess } from '@/services/access-control/hooks/useForumAccess';
import { useFeedForumPosts } from '@/services/feed/hooks/useFeedForumPosts';
import { useFeedCommentCounts } from '@/services/feed/hooks/useFeedCommentCounts';
import { feedQueryKeys } from '@/services/feed/constants';

interface UseFeedSocialResult {
  /** The one switch every social UI surface gates on — false means the feed is
   *  pixel- and network-identical to the pre-feature /home. */
  feedSocialActive: boolean;
  /** Access-gated, ready-to-merge posts; undefined = news-only (not loaded,
   *  no access, error — the caller never needs to know which). */
  forumPosts: IFeedForumPost[] | undefined;
  hasAccess: boolean;
}

// Composition hook: all of the feed-social data machinery in one testable unit
// so TeamNews.tsx (already ~580 load-bearing lines) only gains a render switch.
//
// Gating model (decision I6): the posts query fires for any signed-in user —
// the server's 403 is the access check (one round trip, typed as an expected
// error, never retried). useForumAccess separately gates RENDERING, live: a
// disabled/gated query keeps serving cached data in React Query v5, so
// `enabled` alone must never be the thing hiding content.
export function useFeedSocial({ newsUids }: { newsUids: string[] }): UseFeedSocialResult {
  const queryClient = useQueryClient();
  const { currentUser } = useCurrentUserStore();
  const { hasAccess, isLoading: accessLoading } = useForumAccess();

  const postsQuery = useFeedForumPosts({ enabled: FEED_SOCIAL_ENABLED && !!currentUser });

  // Counts are public — signed-out visitors see them on news items too.
  useFeedCommentCounts({ uids: newsUids, enabled: FEED_SOCIAL_ENABLED });

  // Seed forum-post counts into the single counts entry (their commentCount is
  // embedded in the posts response; the batch endpoint only covers news uids).
  // Existing values win — a count the viewer already bumped by commenting must
  // not be reset by a later posts arrival.
  const postsData = postsQuery.data;
  useEffect(() => {
    if (!postsData || postsData.items.length === 0) return;
    const seed: IFeedCommentCountsResponse = Object.fromEntries(
      postsData.items.map((p) => [p.uid, p.commentCount]),
    );
    queryClient.setQueryData<IFeedCommentCountsResponse>(feedQueryKeys.commentCounts(), (old) => ({
      ...seed,
      ...old,
    }));
  }, [postsData, queryClient]);

  // Mid-session revocation: flipping `enabled` false does NOT clear cached data
  // (and a disabled query ignores invalidateQueries) — purge it so a revoked
  // viewer can't keep reading posts until gcTime. No-op when nothing is cached.
  useEffect(() => {
    if (!accessLoading && !hasAccess && queryClient.getQueryData(feedQueryKeys.forumPosts())) {
      queryClient.removeQueries({ queryKey: feedQueryKeys.forumPosts() });
    }
  }, [accessLoading, hasAccess, queryClient]);

  return {
    feedSocialActive: FEED_SOCIAL_ENABLED,
    forumPosts: FEED_SOCIAL_ENABLED && hasAccess ? postsQuery.data?.items : undefined,
    hasAccess,
  };
}
