'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { IFeedAuthor, IFeedComment, IFeedCommentCountsResponse, IFeedCommentsResponse } from '@/types/feed.types';
import { useCurrentUserStore } from '@/services/auth/store';
import { feedQueryKeys } from '../constants';
import { createFeedComment } from '../feed.service';

// The fixture store can't derive the author from a JWT the way the real
// endpoint does, so mock mode gets the viewer from the client user store.
function viewerAuthorFrom(currentUser: ReturnType<typeof useCurrentUserStore.getState>['currentUser']): IFeedAuthor {
  return {
    memberUid: currentUser?.uid ?? 'mock-viewer',
    name: currentUser?.name ?? 'You',
    avatarUrl: currentUser?.profileImageUrl ?? null,
    role: currentUser?.mainTeamName ? `Member @ ${currentUser.mainTeamName}` : null,
  };
}

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
  const { currentUser } = useCurrentUserStore();

  return useMutation<IFeedComment, Error, { text: string }>({
    scope: { id: `feed-comment-${itemUid}` },
    mutationFn: ({ text }) => createFeedComment({ itemUid, text }, viewerAuthorFrom(currentUser)),
    onSuccess: async (created) => {
      // Cancel BEFORE writing — an in-flight thread/counts refetch whose server
      // snapshot predates this POST would clobber the prepend when it lands.
      await Promise.all([
        queryClient.cancelQueries({ queryKey: feedQueryKeys.comments(itemUid) }),
        queryClient.cancelQueries({ queryKey: feedQueryKeys.commentCounts() }),
      ]);
      queryClient.setQueryData<IFeedCommentsResponse>(feedQueryKeys.comments(itemUid), (old) =>
        old ? { items: [created, ...old.items], total: old.total + 1 } : { items: [created], total: 1 },
      );
      queryClient.setQueryData<IFeedCommentCountsResponse>(feedQueryKeys.commentCounts(), (old) =>
        old ? { ...old, [itemUid]: (old[itemUid] ?? 0) + 1 } : { [itemUid]: 1 },
      );
    },
  });
}
