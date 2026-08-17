import type { IFeedForumPostLikeStatus } from '@/types/feed.types';
import { getStoredForumPostLike } from '@/utils/forumPostLikeStorage';

/**
 * Resolve a forum post's like state from the four things that can know it,
 * in order of authority. Applied at render time only — never written back to a
 * query cache, so the session-frozen feed can't reorder.
 *
 * 1. **The viewer's own toggle** (`ownToggle`), which is newer than anything a
 *    fetch can say, and is what the optimistic overlay holds.
 * 2. **The topic** (`topicLike`), available once its thread has been opened.
 *    This is the only LIVE source of `viewerHasLiked`: the /api/recent listing
 *    that builds the card carries no per-viewer vote state at all.
 * 3. **The local like cache** (localStorage, keyed by uid), a best-effort
 *    record of what this browser has previously learned or done — a like made
 *    last session, or made on /forum — kept for exactly the case (2) doesn't
 *    cover: a post whose thread hasn't been opened this session.
 * 4. **The post itself**, whose `viewerHasLiked` is therefore always false — a
 *    blind default, not a fact.
 *
 * Why this matters: without (2)/(3), a member who already liked a post sees an
 * un-liked button, and clicking it sends a vote NodeBB ignores while the local
 * count climbs by one. Feeding the resolved value into the toggle handler also
 * means the correction lands in the overlay on first use and outlives the modal.
 */
export function resolveForumPostLike<T extends IFeedForumPostLikeStatus & { uid: string }>(
  post: T,
  topicLike: IFeedForumPostLikeStatus | undefined,
  ownToggle: IFeedForumPostLikeStatus | undefined,
): T {
  const storedLiked = getStoredForumPostLike(post.uid);
  return {
    ...post,
    ...(storedLiked !== undefined ? { viewerHasLiked: storedLiked } : {}),
    ...topicLike,
    ...ownToggle,
  };
}
