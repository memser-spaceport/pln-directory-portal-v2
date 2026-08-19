import type { IFeedForumPost } from '@/types/feed.types';

/**
 * Is this forum post the viewer's own?
 *
 * NodeBB refuses a self-vote ([[error:self-vote]]), so a Like on your own post
 * is an affordance that can only fail — it flickers +1 from the optimistic
 * overlay, rolls back on the rejection, and books a like-failed analytics event
 * for something that was never going to work.
 *
 * BOTH sides must be present to count as a match. `toFeedForumPost` defaults an
 * unknown author to `memberUid: ''` (NodeBB doesn't always carry the directory
 * link), and a signed-out viewer has no uid at all — treating `'' === ''` or
 * `undefined === undefined` as "yours" would kill Like on every unattributed
 * post in the feed.
 */
export function isOwnForumPost(
  post: Pick<IFeedForumPost, 'author'>,
  currentUserUid: string | null | undefined,
): boolean {
  const authorUid = post.author?.memberUid;
  return Boolean(authorUid) && Boolean(currentUserUid) && authorUid === currentUserUid;
}

/** Shown on the disabled Like button, and used as its accessible name. */
export const OWN_FORUM_POST_LIKE_REASON = 'You can’t like your own post';
