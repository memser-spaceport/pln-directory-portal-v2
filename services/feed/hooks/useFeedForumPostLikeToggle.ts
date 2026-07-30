'use client';

import { useMutation } from '@tanstack/react-query';
import type { IFeedForumPost, IFeedForumPostLikeStatus } from '@/types/feed.types';
import { toggleFeedForumPostLike } from '../feed.service';

// `isLiked` is the desired next state — true adds the vote, false removes it.
// The whole post travels (not just its uid) because the vote goes straight to
// NodeBB now: it needs the topic's `mainPid` as the vote target, and the current
// `likeCount` to derive the new tally NodeBB doesn't return.
export type LikeToggleAction = {
  post: Pick<IFeedForumPost, 'mainPid' | 'likeCount'>;
  isLiked: boolean;
};

// Bare mutation, mirroring useTeamNewsUpvoteToggle: optimism lives in a
// render-time overlay in the component (never the query cache, so the
// session-frozen post list can't reorder), rollback in the caller's onError.
export function useFeedForumPostLikeToggle() {
  return useMutation<IFeedForumPostLikeStatus, Error, LikeToggleAction>({
    mutationFn: ({ post, isLiked }) => toggleFeedForumPostLike(post, isLiked),
  });
}
