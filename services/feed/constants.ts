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
  // ONE cache entry per session — the fetcher posts the stable news-uid set;
  // forum-post counts are seeded into the same entry from the posts response.
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
