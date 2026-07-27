// Wire contract for the /home feed's social layer (forum posts interleaved with
// team news + feed-only comments). The API does not exist yet — these types ARE
// the spec handed to the backend (see docs/plans/2026-07-27-feat-newsfeed-forum-
// posts-inline-comments-plan.md). Until it ships, services/feed/feed.service.ts
// serves fixtures gated behind NEXT_PUBLIC_MOCK_FEED_SOCIAL.
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
}

// GET /v1/feed/forum-posts — member JWT; 403 without forum.read (the client
// treats 403 as an expected "news-only" state, never an error surface).
export interface IFeedForumPostsResponse {
  items: IFeedForumPost[];
}

// GET /v1/feed/comments?itemUid=x — public for news uids; fp_ uids require
// forum.read and 404 indistinguishably otherwise. Newest first, capped.
export interface IFeedCommentsResponse {
  items: IFeedComment[];
  total: number;
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

/** Returned by POST/DELETE /v1/feed/forum-posts/:uid/like (member JWT +
 *  forum.read, idempotent) and carried on every post. */
export type IFeedForumPostLikeStatus = Pick<IFeedForumPost, 'likeCount' | 'viewerHasLiked'>;
