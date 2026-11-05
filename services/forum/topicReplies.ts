/** The parts of a NodeBB `/api/topic/:tid` answer this reads. */
interface TopicLike<P> {
  postcount?: number | string | null;
  posts?: P[] | null;
}

/**
 * A NodeBB topic's replies as members see them: the opening post apart, and soft-deleted replies left out.
 *
 * NodeBB still sends a deleted post to its author and to moderators (greyed out on NodeBB's own pages), so the
 * Directory has to drop it itself, or a post an agent or a moderator deleted stays on screen for exactly the
 * people who would check (LAB-3145). Its `postcount` keeps soft-deleted posts too (only a purge lowers it), so
 * `replyCount` takes off the deleted replies on this page. A deleted reply on a later page of a long thread is
 * still counted.
 */
export function topicReplies<P extends { deleted?: unknown }>(topic: TopicLike<P> | null | undefined) {
  const [mainPost, ...rest] = Array.isArray(topic?.posts) ? topic.posts : [];
  const replies = rest.filter((post) => post && !post.deleted);
  const deletedOnPage = rest.length - replies.length;
  const replyCount = Math.max(0, (Number(topic?.postcount) || 0) - 1 - deletedOnPage);
  return { mainPost: mainPost as P | undefined, replies, replyCount };
}
