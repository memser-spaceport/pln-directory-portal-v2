'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { IFeedComment, IFeedCommentCountsResponse, IFeedCommentsResponse } from '@/types/feed.types';
import { feedQueryKeys } from '../constants';
import { createFeedComment } from '../feed.service';

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
export function useAddFeedComment(itemUid: string) {
  const queryClient = useQueryClient();

  return useMutation<IFeedComment, Error, { text: string }>({
    scope: { id: `feed-comment-${itemUid}` },
    mutationFn: ({ text }) => createFeedComment({ itemUid, text }),
    onSuccess: async (created) => {
      // Cancel BEFORE writing — an in-flight thread/counts refetch whose server
      // snapshot predates this POST would clobber the append when it lands.
      await Promise.all([
        queryClient.cancelQueries({ queryKey: feedQueryKeys.comments(itemUid) }),
        queryClient.cancelQueries({ queryKey: feedQueryKeys.commentCounts() }),
      ]);
      // Comments are oldest-first — a fresh comment belongs at the END of the
      // list, not the front (the mock's newest-first assumption doesn't hold
      // against the real API).
      queryClient.setQueryData<IFeedCommentsResponse>(feedQueryKeys.comments(itemUid), (old) =>
        old ? { items: [...old.items, created] } : { items: [created] },
      );
      queryClient.setQueryData<IFeedCommentCountsResponse>(feedQueryKeys.commentCounts(), (old) =>
        old ? { ...old, [itemUid]: (old[itemUid] ?? 0) + 1 } : { [itemUid]: 1 },
      );
    },
  });
}
