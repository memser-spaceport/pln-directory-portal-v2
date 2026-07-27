'use client';

import { useQuery } from '@tanstack/react-query';
import type { IFeedForumPostsResponse } from '@/types/feed.types';
import { feedQueryKeys } from '../constants';
import { getFeedForumPosts } from '../feed.service';
import { FeedForumPostsForbiddenError } from '../feed.errors';

// Session-frozen post list: staleTime Infinity + no focus refetch means the
// cache never changes mid-session, so the feed's merge order is frozen for free
// (matching the SSR-frozen news semantics — see PR #2677's no-mid-session-resort
// rule). Like optimism lives in a render-time overlay, never in this cache.
//
// `enabled` is an honest fetch gate — the caller passes
// FEED_SOCIAL_ENABLED && !!currentUser. Rendering is separately gated on live
// useForumAccess().hasAccess (a 403 here is the expected no-access signal, so
// the access query is not a fetch prerequisite — one round trip, not two).
export function useFeedForumPosts({ enabled }: { enabled: boolean }) {
  return useQuery<IFeedForumPostsResponse, Error>({
    queryKey: feedQueryKeys.forumPosts(),
    queryFn: getFeedForumPosts,
    enabled,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => !(error instanceof FeedForumPostsForbiddenError) && failureCount < 2,
  });
}
