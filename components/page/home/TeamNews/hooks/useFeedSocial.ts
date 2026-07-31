'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { IFeedCommentCountsResponse, IFeedForumPost } from '@/types/feed.types';
import { useCurrentUserStore } from '@/services/auth/store';
import { useForumAccess } from '@/services/access-control/hooks/useForumAccess';
import { useFeedForumPosts } from '@/services/feed/hooks/useFeedForumPosts';
import { useFeedCommentCounts } from '@/services/feed/hooks/useFeedCommentCounts';
import { FEED_FORUM_POST_WINDOW_DAYS, feedQueryKeys } from '@/services/feed/constants';
import { feedWindowCutoffIso, withinFeedWindow } from '../utils/feedForumPostWindow';

interface UseFeedSocialResult {
  /** Access-gated, ready-to-merge posts, trimmed to the last
   *  FEED_FORUM_POST_WINDOW_DAYS; undefined = news-only (not loaded, no access,
   *  error — the caller never needs to know which). This is the default for ALL
   *  rendering, counting, merging and analytics. */
  forumPosts: IFeedForumPost[] | undefined;
  /** The same access-gated list with only the date window lifted — NOT the
   *  access gate, which applies identically to both. Exists solely so a shared
   *  ?post= link to an older topic still resolves and renders; anything that
   *  decides what the feed SHOWS must use `forumPosts` instead. */
  unwindowedForumPosts: IFeedForumPost[] | undefined;
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

  // Mount-time cutoff (setter-less useState, the same idiom useForumPostDeepLink
  // uses and what this repo's react-hooks/refs rule requires instead of reading
  // the clock in the render body). Fixed once because the posts query is
  // session-frozen: a cutoff recomputed each render would creep forward and
  // could drop a post out from under someone mid-read.
  //
  // No hydration risk from the clock read: on the server the user store is
  // unhydrated, so hasAccess is false and forumPosts is undefined — the cutoff
  // never reaches rendered output.
  const [cutoffIso] = useState(() => feedWindowCutoffIso(FEED_FORUM_POST_WINDOW_DAYS, Date.now()));

  const unwindowedForumPosts = hasAccess ? postsQuery.data?.items : undefined;
  // Memoized, not just tidy: TeamNews feeds this array into useMemo deps whose
  // whole purpose is to keep the feed merge from re-running on unrelated
  // renders (upvote-overlay writes). A fresh .filter() every render would
  // silently defeat that.
  const forumPosts = useMemo(
    () => withinFeedWindow(unwindowedForumPosts, cutoffIso),
    [unwindowedForumPosts, cutoffIso],
  );

  return {
    forumPosts,
    unwindowedForumPosts,
    hasAccess,
    deepLinkSettled,
  };
}
