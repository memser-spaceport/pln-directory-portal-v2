// The /home feed's social layer: forum posts interleaved with team news, plus
// comment threads on both.
//
// These are the FRONTEND's own shapes, not a wire echo — deliberately, because
// the feed now draws one UI from two unrelated backends:
//
//   - team news comments  → the directory backend (/v1/feed/comments), which
//     returns an already-nested tree keyed on `newsItemUid`/`parentUid`
//   - forum post comments → NodeBB directly (/api/topic/:tid), which returns a
//     FLAT post list nested on `parent.pid`
//
// Neither wire shape can serve the other, so both are mapped into the types
// below at the service boundary (services/feed/feed.service.ts). That is also
// why the field here is `itemUid`, not the backend's `newsItemUid`: it holds a
// news uid OR a ForumPostUid, and `newsItemUid` would be a lie for half of them.
//
// See docs/NEWSFEED_FORUM_POSTS.md in memser-spaceport/pln-directory-portal
// (BE PR #3293) for the wire contract, and
// docs/plans/2026-07-30-feat-newsfeed-forum-comments-replies-plan.md for the
// integration.
//
// Field-nullability rule: `| null` = the field is always present but may be
// null; `?` is reserved for fields that genuinely don't exist on every source.

/** Contract guarantee: forum-post uids are 'fp_'-prefixed — never collide with
 *  news uids, so both kinds share one comment/deep-link namespace safely. */
export type ForumPostUid = `fp_${string}`;

export function isForumPostUid(uid: string): uid is ForumPostUid {
  return uid.startsWith('fp_');
}

/** Author of a forum POST (not a comment). NodeBB supplies the member link and
 *  a composed role for these, so they stay richer than comment authors. */
export interface IFeedAuthor {
  memberUid: string;
  name: string;
  avatarUrl: string | null;
  /** Pre-composed display role, e.g. "Founder @ Lattice Compute". */
  role: string | null;
}

/** Author of a COMMENT. The directory backend sends `{uid, name, avatarUrl}`
 *  and nothing else — `name` really can be null, and there is no role. */
export interface IFeedCommentAuthor {
  uid: string;
  name: string | null;
  avatarUrl: string | null;
  /** NodeBB-sourced comments only (from `user.teamRole`); absent on news
   *  comments, which the directory backend gives us no role for. */
  role?: string | null;
}

export interface IFeedForumPost {
  uid: ForumPostUid;
  /** NodeBB topic id — the uid's numeric half, kept as a field so callers never
   *  parse the uid, and so votes/replies have a target without a lookup. */
  tid: number;
  /** The topic's own opening post. Vote target for the post's Like, and the
   *  default reply target for a top-level comment. */
  mainPid: number;
  /** PLAIN TEXT (NodeBB HTML stripped + entities decoded by the service).
   *  Never raw or rendered HTML — rich content would be a new field with its
   *  own sanitization contract. Same rule for `body`. */
  title: string;
  body: string;
  author: IFeedAuthor;
  /** Aligns the post with the feed's focus-area tabs (same titles as news).
   *  NodeBB has no equivalent, so this is always empty today. */
  focusAreas: string[];
  /** Forum category label, shown where news shows its event type. */
  category: string;
  createdAt: string;
  /** In-app path to the origin topic (`/forum/topics/:cid/:tid`), for "view the
   *  full discussion" — same form CreatePost builds. Not an absolute URL, so
   *  it's never what gets shared; the share menu links to `/home?post=`. */
  forumTopicUrl: string | null;
  /** Replies to the topic at any depth (NodeBB's postcount minus the opening
   *  post). May exceed the number of comments a single page can show — see
   *  getFeedComments. */
  commentCount: number;
  likeCount: number;
  viewerHasLiked: boolean;
}

export interface IFeedComment {
  uid: string;
  /** News uid or ForumPostUid the comment hangs off. */
  itemUid: string;
  /** Parent comment uid, or null for a top-level comment. */
  parentUid: string | null;
  author: IFeedCommentAuthor;
  /** Plain text, capped at FEED_COMMENT_MAX_LENGTH. */
  text: string;
  createdAt: string;
  /** True only for the authenticated caller's own comments (always false for
   *  anonymous requests, and always false for NodeBB-sourced comments, which
   *  have no delete path) — gates the delete affordance. Rendered straight off
   *  the payload, no overlay: unlike likes, comments never feed
   *  mergeFeedEntries' rank-merge, so there's no reordering risk to guard
   *  against by mutating the cache indirectly. */
  isOwn: boolean;
  /** Direct replies, oldest first. Nesting is UNLIMITED on the wire — the
   *  directory backend's `parentUid` is a plain self-relation — so display
   *  depth is capped separately by clampDepth, never assumed here. */
  replies: IFeedComment[];
}

/** Forum posts are sourced live from NodeBB's GET /api/recent by
 *  getFeedForumPosts — never stored or proxied by the directory backend. */
export interface IFeedForumPostsResponse {
  items: IFeedForumPost[];
}

/** What the forum can tell us about a topic that its reply list alone can't.
 *  Present only for forum posts, where the thread comes from NodeBB. */
export interface IFeedForumTopicMeta {
  /** In-app path to the topic, for "see the rest of this on the forum". */
  url: string | null;
  /** Replies the topic actually has, at any depth. NodeBB serves one page of
   *  posts per request, so this can exceed the number in `items`. */
  totalReplyCount: number;
  /** The topic's own vote state, which the /api/recent listing doesn't carry —
   *  the only way a forum card can learn whether the viewer already liked it. */
  like: IFeedForumPostLikeStatus;
}

/** Top-level comments, oldest first, each with its own `replies`. No `total`
 *  field: every consumer derives counts from the tree rather than maintaining a
 *  second counter in lockstep. */
export interface IFeedCommentsResponse {
  items: IFeedComment[];
  /** Forum posts only. */
  forumTopic?: IFeedForumTopicMeta;
}

/** Keyed by item uid. A uid the server omitted means "unknown" and must render
 *  as no number, never a fake 0. */
export type IFeedCommentCountsResponse = Record<string, number>;

/** Internal request shape. The service translates it per backend: a
 *  `newsItemUid`/`parentUid` body for news, a NodeBB `toPid` reply for posts. */
export interface ICreateFeedCommentRequest {
  itemUid: string;
  /** Reply target; omitted for a top-level comment. */
  parentUid?: string;
  text: string;
  /** Forum posts only: the topic's opening post, which a top-level comment
   *  replies to. Supplied by the surface that already has the post so the write
   *  costs one request; the service falls back to fetching the topic without it. */
  forumMainPid?: number;
}

/** DELETE /v1/feed/comments/:commentUid — member JWT, author-only (403
 *  otherwise), cascades to the comment's replies. Idempotent from the client's
 *  perspective: a 404 (already deleted, e.g. a double-delete from two tabs) is
 *  mapped to this same success shape by the service layer. */
export interface IFeedCommentDeleteResponse {
  uid: string;
  deleted: true;
}

/** Returned by toggleFeedForumPostLike, which votes directly on NodeBB
 *  (PUT/DELETE {FORUM_API_URL}/api/v3/posts/:mainPid/vote), and carried on
 *  every post. */
export type IFeedForumPostLikeStatus = Pick<IFeedForumPost, 'likeCount' | 'viewerHasLiked'>;
