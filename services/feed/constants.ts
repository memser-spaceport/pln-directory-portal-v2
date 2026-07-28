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
