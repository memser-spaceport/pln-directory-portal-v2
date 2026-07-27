// 403 from GET /v1/feed/forum-posts is an EXPECTED state (viewer lacks
// forum.read) — the feed silently stays news-only. It gets its own error type
// so useFeedForumPosts can exclude it from retries and callers never surface
// it as a failure. Lives in its own module because both feed.service.ts and
// the lazily-imported feed.mock-data.ts need it.
export class FeedForumPostsForbiddenError extends Error {
  constructor() {
    super('Viewer does not have forum access');
    this.name = 'FeedForumPostsForbiddenError';
  }
}
