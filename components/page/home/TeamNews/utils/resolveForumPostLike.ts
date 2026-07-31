import type { IFeedForumPostLikeStatus } from '@/types/feed.types';

/**
 * Resolve a forum post's like state from the three things that can know it,
 * in order of authority. Applied at render time only — never written back to a
 * query cache, so the session-frozen feed can't reorder.
 *
 * 1. **The viewer's own toggle** (`ownToggle`), which is newer than anything a
 *    fetch can say, and is what the optimistic overlay holds.
 * 2. **The topic** (`topicLike`), available once its thread has been opened.
 *    This is the only source of `viewerHasLiked`: the /api/recent listing that
 *    builds the card carries no per-viewer vote state at all.
 * 3. **The post itself**, whose `viewerHasLiked` is therefore always false — a
 *    blind default, not a fact.
 *
 * Why this matters: without (2), a member who already liked a post sees an
 * un-liked button, and clicking it sends a vote NodeBB ignores while the local
 * count climbs by one. Feeding the resolved value into the toggle handler also
 * means the correction lands in the overlay on first use and outlives the modal.
 */
export function resolveForumPostLike<T extends IFeedForumPostLikeStatus>(
  post: T,
  topicLike: IFeedForumPostLikeStatus | undefined,
  ownToggle: IFeedForumPostLikeStatus | undefined,
): T {
  return { ...post, ...topicLike, ...ownToggle };
}
