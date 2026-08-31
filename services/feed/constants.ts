export enum FeedQueryKeys {
  FORUM_POSTS = 'feed-forum-posts',
  COMMENT_COUNTS = 'feed-comment-counts',
  COMMENTS = 'feed-comments',
}

// Typed key factory — the three queries, the add-comment mutation, and the
// modal's shared thread cache all reference these; hand-assembled tuples drift.
// Everything roots under 'feed' so the real-API swap can fuzzy-invalidate the
// whole domain with one queryKey: feedQueryKeys.all.
export const feedQueryKeys = {
  all: ['feed'] as const,
  forumPosts: () => [...feedQueryKeys.all, FeedQueryKeys.FORUM_POSTS] as const,
  // ONE cache entry per session, filled INCREMENTALLY: each surface (the feed,
  // a team profile's rail, its archive as it pages) asks only for the uids
  // nobody has asked for yet and merges the answer in. Forum-post counts are
  // seeded into the same entry from the posts response. Deliberately not keyed
  // by the visible uid set — that would mint a new entry per tab/search/page and
  // make the comment mutations' count patch untargetable.
  commentCounts: () => [...feedQueryKeys.all, FeedQueryKeys.COMMENT_COUNTS] as const,
  comments: (itemUid: string) => [...feedQueryKeys.all, FeedQueryKeys.COMMENTS, itemUid] as const,
};

// Server-authoritative bound (mirrored client-side as the composer maxLength).
export const FEED_COMMENT_MAX_LENGTH = 2000;

// A thread that goes 60s stale is not worth a focus-refetch burst; re-expands
// within a minute are cache hits.
export const FEED_COMMENTS_STALE_TIME = 60_000;

// Forum posts are trimmed to the same window the news side already uses
// (TEAM_NEWS_DEFAULT_WINDOW_DAYS, sent to the backend as ?windowDays=) and that
// the feed's empty state already promises — "No network news in the last 14
// days yet". Deliberately a separate constant rather than an import: the two
// govern different domains (a NodeBB client-side trim vs. a directory query
// param) and happening to share a value today shouldn't couple them.
//
// Client-side because it cannot be pushed down: NodeBB's /api/recent only
// accepts ?term=daily|weekly|monthly — there is no 14-day term.
export const FEED_FORUM_POST_WINDOW_DAYS = 14;

// For You is a tighter cut of the same list: every post *created* in the last
// 7 days, not every thread that saw activity. All / Discussions keep measuring
// lastActivityAt over FEED_FORUM_POST_WINDOW_DAYS so an older thread that got a
// reply this week still shows there — it just isn't "posted this week".
export const FEED_FOR_YOU_FORUM_POST_WINDOW_DAYS = 7;
