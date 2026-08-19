import type { IFeedComment } from '@/types/feed.types';

/**
 * Every comment in a thread, replies at any depth included.
 *
 * Depth-independent by construction, so it gives the same answer before and
 * after `clampDepth` — that helper lifts over-deep replies to the cap rather
 * than dropping them, and this counts nodes rather than levels.
 *
 * For a news item the result is the backend's own number: `listComments` is an
 * unpaginated `findMany` over the same table the counts endpoint aggregates
 * with `groupBy`, and its parent/child assembly re-parents nothing away. A
 * forum post is the exception — NodeBB serves one page of a topic at a time, so
 * there the topic's `totalReplyCount` is the count and this is only the subset
 * that arrived.
 */
export function countComments(comments: readonly IFeedComment[]): number {
  return comments.reduce((total, comment) => total + 1 + countComments(comment.replies), 0);
}
