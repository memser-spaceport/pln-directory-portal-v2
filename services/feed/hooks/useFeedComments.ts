'use client';

import { skipToken, useQuery } from '@tanstack/react-query';
import type { IFeedCommentsResponse, IFeedForumPostLikeStatus } from '@/types/feed.types';
import { getCookiesFromClient } from '@/utils/third-party.helper';
import { FEED_COMMENTS_STALE_TIME, feedQueryKeys } from '../constants';
import { getFeedComments } from '../feed.service';

// Lazy per-item thread query — `enabled` is "thread expanded". The card thread
// and the detail modals all observe the same cache entry (one fetch, N
// surfaces, and useAddFeedComment's prepend lands everywhere at once). Callers
// unmount the thread on collapse: no observer ⇒ no focus refetch, while the
// entry survives gcTime so re-opening is instant.
export function useFeedComments(itemUid: string, { enabled }: { enabled: boolean }) {
  return useQuery<IFeedCommentsResponse, Error>({
    queryKey: feedQueryKeys.comments(itemUid),
    queryFn: () => getFeedComments(itemUid, getCookiesFromClient().authToken),
    enabled,
    staleTime: FEED_COMMENTS_STALE_TIME,
    refetchOnWindowFocus: false,
    // One retry, not the provider's default three. This is a foreground fetch
    // a member is waiting on with an open thread: three attempts with backoff
    // means the error state — and the retry button, and the analytics that go
    // with it — arrive around seven seconds late, by which point most people
    // have collapsed the thread and become invisible.
    retry: 1,
  });
}

// A forum post's Like starts out blind: /api/recent builds the card and carries
// no per-viewer vote state, so `viewerHasLiked` is false until something says
// otherwise. Opening the thread fetches the topic, which does know — this
// observes that same cache entry (skipToken = observe only, never fetch) and
// narrows to the vote state with `select`, the same pattern the per-button
// comment counts use, so the feed doesn't re-render when comments load.
export function useFeedForumTopicLike(itemUid: string | null): IFeedForumPostLikeStatus | undefined {
  const { data } = useQuery<IFeedCommentsResponse, Error, IFeedForumPostLikeStatus | undefined>({
    queryKey: feedQueryKeys.comments(itemUid ?? ''),
    queryFn: skipToken,
    select: (response) => response.forumTopic?.like,
    enabled: Boolean(itemUid),
  });
  return data;
}

// The opening post's full content HTML, off the same cache entry the modal's
// own FeedCommentsThread fetches (skipToken = observe only, never a second
// request). Undefined until that fetch lands — the modal shows the card's
// plain teaser meanwhile. RAW NodeBB HTML: the consumer sanitizes at render.
export function useFeedForumTopicBodyHtml(itemUid: string | null): string | undefined {
  const { data } = useQuery<IFeedCommentsResponse, Error, string | undefined>({
    queryKey: feedQueryKeys.comments(itemUid ?? ''),
    queryFn: skipToken,
    select: (response) => response.forumTopic?.bodyHtml,
    enabled: Boolean(itemUid),
  });
  return data;
}
