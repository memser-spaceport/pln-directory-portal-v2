// Wire contract for the /home feed's social layer (forum posts interleaved with
// team news + feed-only comments).
//
// Forum posts (IFeedForumPost) are fetched directly from NodeBB by
// services/feed/feed.service.ts (getFeedForumPosts/toggleFeedForumPostLike) —
// there is no backend proxy for them anymore. Feed comments (IFeedComment,
// on a TeamNewsItem) are still served by the directory backend; see
// docs/NEWSFEED_FORUM_POSTS.md in pln-directory-portal.
//
// Field-nullability rule for this contract: `| null` = the server always sends
// the field but it may be null; `?` is reserved for fields that genuinely don't
// ship yet. No optional fields unless deferred.

/** Contract guarantee: forum-post uids are 'fp_'-prefixed — never collide with
 *  news uids, so both kinds share one comment/deep-link namespace safely. */
export type ForumPostUid = `fp_${string}`;

export function isForumPostUid(uid: string): uid is ForumPostUid {
  return uid.startsWith('fp_');
}

export interface IFeedAuthor {
  memberUid: string;
  name: string;
  avatarUrl: string | null;
  /** Pre-composed display role, e.g. "Founder @ Lattice Compute". */
  role: string | null;
}

export interface IFeedForumPost {
  uid: ForumPostUid;
  /** Server-side derived PLAIN TEXT (NodeBB HTML stripped + entities decoded).
   *  Never raw or rendered HTML — rich content would be a new field with its
   *  own sanitization contract. Same rule for `body`. */
  title: string;
  body: string;
  author: IFeedAuthor;
  /** Aligns the post with the feed's focus-area tabs (same titles as news). */
  focusAreas: string[];
  /** Forum category label, shown where news shows its event type. */
  category: string;
  createdAt: string;
  /** Origin NodeBB topic link (display only — feed comments never sync to it).
   *  Absolute https URL on the forum host, or null. */
  forumTopicUrl: string | null;
  commentCount: number;
  likeCount: number;
  viewerHasLiked: boolean;
}

export interface IFeedComment {
  uid: string;
  /** News uid or ForumPostUid the comment hangs off. */
  itemUid: string;
  author: IFeedAuthor;
  /** Plain text, server-capped at FEED_COMMENT_MAX_LENGTH. */
  text: string;
  createdAt: string;
  /** True only for the authenticated caller's own comments (always false for
   *  anonymous requests) — gates the delete affordance. Rendered straight off
   *  the server payload, no overlay: unlike likes, comments never feed
   *  mergeFeedEntries' rank-merge, so there's no reordering risk to guard
   *  against by mutating the cache indirectly. */
  isOwn: boolean;
}

// Sourced live from NodeBB's GET /api/recent (see getFeedForumPosts) —
// never stored or proxied by the directory backend.
export interface IFeedForumPostsResponse {
  items: IFeedForumPost[];
}

// GET /v1/feed/comments?itemUid=x — public for news uids; fp_ uids require
// forum.read and 404 indistinguishably otherwise. Oldest first (thread reading
// order) — no `total` field; every consumer derives the count from
// `items.length` instead of maintaining a second counter in lockstep.
export interface IFeedCommentsResponse {
  items: IFeedComment[];
}

// POST /v1/feed/comments/counts { uids } — public; counts for fp_ uids are
// omitted (not zeroed) unless the caller has forum.read. Keys are item uids.
export type IFeedCommentCountsResponse = Record<string, number>;

// POST /v1/feed/comments — member JWT; fp_ itemUids additionally require
// forum.read (visibility implies commentability). Feed-only: never creates or
// updates a NodeBB thread reply.
export interface ICreateFeedCommentRequest {
  itemUid: string;
  text: string;
}

// DELETE /v1/feed/comments/:commentUid — member JWT, author-only (403
// otherwise). Idempotent from the client's perspective: a 404 (already
// deleted, e.g. a double-delete from two tabs) is mapped to this same success
// shape by the service layer rather than surfaced as an error.
export interface IFeedCommentDeleteResponse {
  uid: string;
  deleted: true;
}

/** Returned by toggleFeedForumPostLike, which votes directly on NodeBB
 *  (PUT/DELETE {FORUM_API_URL}/api/v3/posts/:pid/vote) and is carried on
 *  every post. */
export type IFeedForumPostLikeStatus = Pick<IFeedForumPost, 'likeCount' | 'viewerHasLiked'>;
