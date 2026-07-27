'use client';

import { useMutation } from '@tanstack/react-query';
import type { ForumPostUid, IFeedForumPostLikeStatus } from '@/types/feed.types';
import { toggleFeedForumPostLike } from '../feed.service';

// `isLiked` is the desired next state — true POSTs a like, false DELETEs it.
export type LikeToggleAction = { uid: ForumPostUid; isLiked: boolean };

// Bare mutation, mirroring useTeamNewsUpvoteToggle: optimism lives in a
// render-time overlay in the component (never the query cache, so the
// session-frozen post list can't reorder), rollback in the caller's onError.
export function useFeedForumPostLikeToggle() {
  return useMutation<IFeedForumPostLikeStatus, Error, LikeToggleAction>({
    mutationFn: ({ uid, isLiked }) => toggleFeedForumPostLike(uid, isLiked),
  });
}
