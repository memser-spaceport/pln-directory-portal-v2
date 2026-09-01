import type { IFeedForumPost } from '@/types/feed.types';

// The feed's 14-day window for forum posts, kept as pure functions so the
// boundary is unit-testable without a hook harness.
//
// Why client-side: NodeBB's /api/recent takes ?term=daily|weekly|monthly and
// nothing else, so an exact 14-day window can't be pushed down. The single
// ~20-topic page it returns is trimmed here instead.

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** The oldest activity a post may have and still show. Takes `nowMs` rather
 *  than reading the clock so callers own when the boundary is fixed — see
 *  useFeedSocial, which snapshots it once per session. */
export function feedWindowCutoffIso(days: number, nowMs: number): string {
  return new Date(nowMs - days * MS_PER_DAY).toISOString();
}

/** Posts whose latest activity — creation or last reply, whichever is later —
 *  is at or after the cutoff. Compares ISO strings directly: toISOString() is
 *  fixed-width UTC, so lexicographic order is chronological order, the same
 *  property mergeFeedEntries already relies on.
 *
 *  Undefined in, undefined out: `undefined` means "news-only feed" (not loaded,
 *  no access, or error) and must not collapse into an empty-but-loaded list. */
export function withinFeedWindow(posts: IFeedForumPost[] | undefined, cutoffIso: string): IFeedForumPost[] | undefined {
  return posts?.filter((post) => post.lastActivityAt >= cutoffIso);
}

/** Posts *created* at or after the cutoff. For You's L7D rule — "posted this
 *  week" — not lastActivityAt. A 10-day-old thread with a reply yesterday stays
 *  on All / Discussions and drops out of For You. Same undefined-passthrough as
 *  withinFeedWindow. */
export function createdWithinWindow(
  posts: IFeedForumPost[] | undefined,
  cutoffIso: string,
): IFeedForumPost[] | undefined {
  return posts?.filter((post) => post.createdAt >= cutoffIso);
}
