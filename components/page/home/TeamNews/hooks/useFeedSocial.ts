'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { IFeedCommentCountsResponse, IFeedForumPost } from '@/types/feed.types';
import { useCurrentUserStore } from '@/services/auth/store';
import { useForumAccess } from '@/services/access-control/hooks/useForumAccess';
import { useFeedForumPosts } from '@/services/feed/hooks/useFeedForumPosts';
import { useFeedCommentCounts } from '@/services/feed/hooks/useFeedCommentCounts';
import { feedQueryKeys } from '@/services/feed/constants';

interface UseFeedSocialResult {
  /** Access-gated, ready-to-merge posts; undefined = news-only (not loaded,
   *  no access, error — the caller never needs to know which). */
  forumPosts: IFeedForumPost[] | undefined;
  hasAccess: boolean;
  /** True once a ?post= deep link can be resolved conclusively — every async
   *  gate (store hydration, access query, posts query) has settled. Built on
   *  isPending (never isLoading: a disabled query is pending forever but
   *  isLoading false, which would strip valid links before identity loads) and
   *  treats query errors as terminal, so the resolver can't hang. */
  deepLinkSettled: boolean;
}

// Composition hook: all of the feed-social data machinery in one testable unit
// so TeamNews.tsx (already ~580 load-bearing lines) only gains a render switch.
//
// Gating model (decision I6): the posts query fires for any signed-in user —
// an empty {items: []} is the access check (no access is indistinguishable
// from no posts, and that's fine — see docs/NEWSFEED_FORUM_POSTS.md).
// useForumAccess separately gates RENDERING, live: a disabled/gated query
// keeps serving cached data in React Query v5, so `enabled` alone must never
// be the thing hiding content.
export function useFeedSocial({ newsUids }: { newsUids: string[] }): UseFeedSocialResult {
  const queryClient = useQueryClient();
  const { currentUser, isHydrated } = useCurrentUserStore();
  const { hasAccess, isLoading: accessLoading, isPending: accessPending, isError: accessError } = useForumAccess();

  const postsQuery = useFeedForumPosts({ enabled: !!currentUser });

  // Counts are public — signed-out visitors see them on news items too.
  useFeedCommentCounts({ uids: newsUids, enabled: true });

  // Seed forum-post counts into the single counts entry (their commentCount is
  // embedded in the posts response; the batch endpoint only covers news uids).
  // Existing values win — a count the viewer already bumped by commenting must
  // not be reset by a later posts arrival.
  const postsData = postsQuery.data;
  useEffect(() => {
    // Optional-chained rather than trusting the type: jsdom tests stub
    // useQuery with a generic data shape.
    if (!postsData?.items?.length) return;
    const seed: IFeedCommentCountsResponse = Object.fromEntries(postsData.items.map((p) => [p.uid, p.commentCount]));
    queryClient.setQueryData<IFeedCommentCountsResponse>(feedQueryKeys.commentCounts(), (old) => ({
      ...seed,
      ...old,
    }));
  }, [postsData, queryClient]);

  // Mid-session revocation: flipping `enabled` false does NOT clear cached data
  // (and a disabled query ignores invalidateQueries) — purge it so a revoked
  // viewer can't keep reading posts until gcTime. The getQueryData guard makes
  // the common no-access path (nothing cached) a no-op instead of a
  // remove-refetch cycle.
  useEffect(() => {
    if (!accessLoading && !hasAccess && queryClient.getQueryData(feedQueryKeys.forumPosts())) {
      queryClient.removeQueries({ queryKey: feedQueryKeys.forumPosts() });
    }
  }, [accessLoading, hasAccess, queryClient]);

  // The five-state resolution matrix (tested in use-forum-post-deep-link tests):
  // signed-out → settled(hidden); access loading → pending; access error →
  // settled(hidden); access ok + posts loading → pending; posts loaded/error →
  // settled. isPending is guarded by currentUser because a disabled query
  // never leaves pending.
  const accessGatePending = !!currentUser && accessPending && !accessError;
  const postsGatePending = hasAccess && postsQuery.isPending && !postsQuery.isError;
  const deepLinkSettled = isHydrated && !accessGatePending && !postsGatePending;

  return {
    forumPosts: hasAccess ? postsQuery.data?.items : undefined,
    hasAccess,
    deepLinkSettled,
  };
}
