'use client';

import { useQuery } from '@tanstack/react-query';
import type { IFeedCommentsResponse } from '@/types/feed.types';
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
  });
}
