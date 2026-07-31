'use client';

import { skipToken, useQuery } from '@tanstack/react-query';
import type { IFeedCommentCountsResponse } from '@/types/feed.types';
import { getCookiesFromClient } from '@/utils/third-party.helper';
import { feedQueryKeys } from '../constants';
import { getFeedCommentCounts } from '../feed.service';

// ONE cache entry per session (stable key — never derived from the visible
// subset, which would mint a new key per tab/search/pagination change and make
// the mutation's count patch untargetable). The uid universe is session-stable:
// news uids come from the SSR groups prop; forum-post counts are seeded into
// this same entry from the posts response (useFeedSocial). After a comment is
// posted, useAddFeedComment patches this entry — so no refetching is needed and
// the entry can stay fresh forever.
export function useFeedCommentCounts({ uids, enabled }: { uids: string[]; enabled: boolean }) {
  return useQuery<IFeedCommentCountsResponse, Error>({
    queryKey: feedQueryKeys.commentCounts(),
    // Token is optional (signed-out visitors see news counts) but improves the
    // response: fp_ counts are only included for viewers with forum.read.
    queryFn: () => getFeedCommentCounts(uids, getCookiesFromClient().authToken),
    enabled: enabled && uids.length > 0,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });
}

// Per-button observer: subscribes to the single counts entry with `select`, so
// a count bump re-renders exactly the buttons whose value changed — never the
// feed. Fetching is owned by useFeedCommentCounts (skipToken = observe only).
// `undefined` means "count unknown" — render nothing, never "0".
export function useFeedCommentCount(uid: string): number | undefined {
  const { data } = useQuery<IFeedCommentCountsResponse, Error, number | undefined>({
    queryKey: feedQueryKeys.commentCounts(),
    queryFn: skipToken,
    select: (counts) => counts[uid],
  });
  return data;
}
