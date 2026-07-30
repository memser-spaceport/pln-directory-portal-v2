import { customFetch } from '@/utils/fetch-wrapper';
import { getHeader } from '@/utils/common.utils';
import { stripHtml } from '@/utils/forum';
import { buildCommentTree } from '@/utils/comments';
import { forumFetch, postForumReply } from '@/services/forum/forum.service';
import type { Topic } from '@/services/forum/hooks/useForumPosts';
import type { TopicResponse } from '@/services/forum/hooks/useForumPost';
import {
  isForumPostUid,
  type ForumPostUid,
  type ICreateFeedCommentRequest,
  type IFeedComment,
  type IFeedCommentCountsResponse,
  type IFeedCommentDeleteResponse,
  type IFeedCommentsResponse,
  type IFeedForumPost,
  type IFeedForumPostLikeStatus,
  type IFeedForumPostsResponse,
} from '@/types/feed.types';

// Client-side fetchers for the feed's social layer, against TWO backends:
//
//   - team news comments → the directory backend (/v1/feed/*)
//   - forum posts, their votes, and their comments → NodeBB directly
//
// The split is the backend's: BE PR #3293 deleted GET /v1/feed/forum-posts and
// its like route, and re-pointed FeedComment at a hard TeamNewsItem foreign key,
// so a forum post's comments can only come from the forum itself. Both are
// mapped into types/feed.types.ts' view model here, at the boundary, so nothing
// above this file has to know which backend a comment came from.
//
// Unlike the team-news SSR fetchers, these are React Query queryFns/mutationFns:
// they THROW on failure (never return null) so isError/rollback semantics work.

// The server rejects a batch larger than this (FeedCommentCountsRequestSchema
// caps `uids` at 200) — one oversized request would 400 and take every count
// badge on the page down with it.
const COMMENT_COUNTS_BATCH_SIZE = 200;

// ── Wire shapes (directory backend) ──────────────────────────────────────────
// Deliberately local: the moment these leak upward, every component has to care
// that news comments say `newsItemUid` and forum comments have no such concept.

interface IFeedCommentWire {
  uid: string;
  newsItemUid: string;
  parentUid: string | null;
  text: string;
  author: { uid: string; name: string | null; avatarUrl: string | null };
  createdAt: string;
  isOwn: boolean;
  replies: IFeedCommentWire[];
}

function toFeedComment(wire: IFeedCommentWire): IFeedComment {
  return {
    uid: wire.uid,
    itemUid: wire.newsItemUid,
    parentUid: wire.parentUid ?? null,
    author: {
      uid: wire.author?.uid ?? '',
      name: wire.author?.name ?? null,
      avatarUrl: wire.author?.avatarUrl ?? null,
    },
    text: wire.text,
    createdAt: wire.createdAt,
    isOwn: Boolean(wire.isOwn),
    // The backend nests to unlimited depth; capping is a display concern.
    replies: (wire.replies ?? []).map(toFeedComment),
  };
}

// ── Forum posts (NodeBB) ─────────────────────────────────────────────────────

function tidFromForumPostUid(uid: ForumPostUid): number {
  return Number(uid.slice('fp_'.length));
}

function toFeedForumPost(topic: Topic): IFeedForumPost {
  const user = topic.user;

  return {
    uid: `fp_${topic.tid}`,
    tid: topic.tid,
    mainPid: topic.mainPid,
    title: stripHtml(topic.titleRaw || topic.title || ''),
    body: stripHtml(topic.teaser?.content || ''),
    author: {
      memberUid: user?.memberUid ?? '',
      name: user?.displayname || user?.username || 'Unknown',
      avatarUrl: user?.picture ?? null,
      role: user?.teamRole ?? null,
    },
    // NodeBB categories don't map onto the feed's focus-area tabs, and there is
    // no focusAreas field to map from — posts show in every tab.
    focusAreas: [],
    category: topic.category?.name ?? '',
    createdAt: new Date(Number(topic.timestamp) || Date.now()).toISOString(),
    forumTopicUrl: `/forum/topics/${topic.cid}/${topic.tid}`,
    // postcount includes the topic's own opening post, which is the post itself
    // rather than a comment on it.
    commentCount: Math.max(0, (Number(topic.postcount) || 0) - 1),
    likeCount: Number(topic.upvotes) || 0,
    // /api/recent is a listing with no per-viewer vote state. The modal corrects
    // this from the topic's own post once a thread is opened.
    viewerHasLiked: false,
  };
}

export async function getFeedForumPosts(): Promise<IFeedForumPostsResponse> {
  const response = await forumFetch('/api/recent');
  if (!response?.ok) throw new Error('Failed to fetch feed forum posts');

  const data = await response.json();
  const topics = Array.isArray(data?.topics) ? (data.topics as Topic[]) : [];

  return { items: topics.map(toFeedForumPost) };
}

// PUT adds a vote (NodeBB write API v3), DELETE removes it — the symmetric pair
// of services/forum/hooks/useLikePost.ts's PUT, which only ever likes. The vote
// target is the topic's opening post, carried on the post itself.
export async function toggleFeedForumPostLike(
  post: Pick<IFeedForumPost, 'mainPid' | 'likeCount'>,
  isLiked: boolean,
): Promise<IFeedForumPostLikeStatus> {
  const response = await forumFetch(`/api/v3/posts/${post.mainPid}/vote`, {
    method: isLiked ? 'PUT' : 'DELETE',
    ...(isLiked ? { body: JSON.stringify({ delta: 1 }) } : {}),
  });
  if (!response?.ok) throw new Error('Failed to toggle feed forum post like');

  // NodeBB's vote endpoint doesn't return an updated tally, so the count is
  // adjusted from what we last read. It is corrected on the next real fetch —
  // the same session-frozen-list assumption useFeedForumPosts already makes.
  return {
    likeCount: isLiked ? post.likeCount + 1 : Math.max(0, post.likeCount - 1),
    viewerHasLiked: isLiked,
  };
}

// ── Comment counts ───────────────────────────────────────────────────────────

// Public endpoint (signed-out visitors see news comment counts), but the token
// is still sent when present so `isOwn` and any access-scoped rows resolve.
export async function getFeedCommentCounts(uids: string[], authToken?: string): Promise<IFeedCommentCountsResponse> {
  // Forum-post counts come from the posts response, not from here — the
  // directory backend only knows about news items now.
  const newsUids = uids.filter((uid) => !isForumPostUid(uid));
  if (newsUids.length === 0) return {};

  const batches: string[][] = [];
  for (let i = 0; i < newsUids.length; i += COMMENT_COUNTS_BATCH_SIZE) {
    batches.push(newsUids.slice(i, i + COMMENT_COUNTS_BATCH_SIZE));
  }

  const results = await Promise.all(batches.map((batch) => fetchCommentCountBatch(batch, authToken)));

  return Object.assign({}, ...results) as IFeedCommentCountsResponse;
}

async function fetchCommentCountBatch(uids: string[], authToken?: string): Promise<IFeedCommentCountsResponse> {
  // POST body, not query string — a 14-day news window can exceed URL limits.
  const response = await fetch(`${process.env.DIRECTORY_API_URL}/v1/feed/comments/counts`, {
    method: 'POST',
    headers: { ...getHeader(authToken), 'Content-Type': 'application/json' },
    body: JSON.stringify({ uids }),
  });
  if (!response.ok) throw new Error('Failed to fetch feed comment counts');

  const { counts } = (await response.json()) as { counts: IFeedCommentCountsResponse };
  return counts ?? {};
}

// ── Comments ─────────────────────────────────────────────────────────────────

export async function getFeedComments(itemUid: string, authToken?: string): Promise<IFeedCommentsResponse> {
  if (isForumPostUid(itemUid)) return getForumPostComments(itemUid);

  // Both names are sent on purpose: BE #3293 renamed `itemUid` to
  // `newsItemUid`, and both versions of the schema drop unknown keys, so this
  // one request is valid against either — the frontend and backend can deploy
  // in any order. Drop `itemUid` once #3293 is in production.
  const params = new URLSearchParams({ newsItemUid: itemUid, itemUid });
  const response = await fetch(`${process.env.DIRECTORY_API_URL}/v1/feed/comments?${params.toString()}`, {
    headers: getHeader(authToken),
  });
  if (!response.ok) throw new Error('Failed to fetch feed comments');

  const { items } = (await response.json()) as { items: IFeedCommentWire[] };
  return { items: (items ?? []).map(toFeedComment) };
}

export async function createFeedComment(request: ICreateFeedCommentRequest): Promise<IFeedComment> {
  if (isForumPostUid(request.itemUid)) return createForumPostComment(request);

  const response = await customFetch(
    `${process.env.DIRECTORY_API_URL}/v1/feed/comments`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // Same dual-name insurance as the read above.
      body: JSON.stringify({
        newsItemUid: request.itemUid,
        itemUid: request.itemUid,
        ...(request.parentUid ? { parentUid: request.parentUid } : {}),
        text: request.text,
      }),
    },
    true,
  );
  if (!response?.ok) throw new Error('Failed to post feed comment');

  return toFeedComment((await response.json()) as IFeedCommentWire);
}

// 404 (already deleted — e.g. a double-delete from two tabs) is mapped to the
// same success shape rather than surfaced as an error: the caller's intent
// (this comment gone) is already satisfied.
export async function deleteFeedComment(commentUid: string): Promise<IFeedCommentDeleteResponse> {
  const response = await customFetch(
    `${process.env.DIRECTORY_API_URL}/v1/feed/comments/${encodeURIComponent(commentUid)}`,
    { method: 'DELETE' },
    true,
  );
  if (response?.status === 404) return { uid: commentUid, deleted: true };
  if (!response?.ok) throw new Error('Failed to delete feed comment');

  return (await response.json()) as IFeedCommentDeleteResponse;
}

// ── Forum post comments (NodeBB) ─────────────────────────────────────────────
//
// A forum post's comments are its REAL topic replies, read straight from the
// forum — the directory backend refuses to store comments against forum content
// (FeedComment hard-FKs TeamNewsItem as of BE #3293).

type TopicPost = TopicResponse['posts'][number];

function forumCommentUid(pid: number): string {
  return `fpc_${pid}`;
}

function toForumFeedComment(post: TopicPost, itemUid: ForumPostUid, mainPid: number): IFeedComment {
  const user = post.user;
  const parentPid = post.parent?.pid;

  return {
    uid: forumCommentUid(post.pid),
    itemUid,
    // A reply to the topic's opening post is a top-level comment here — the
    // opening post is the feed card, not a comment on it.
    parentUid: parentPid && parentPid !== mainPid ? forumCommentUid(parentPid) : null,
    author: {
      uid: user?.memberUid ?? '',
      name: user?.displayname || user?.username || null,
      avatarUrl: user?.picture ?? null,
      role: user?.teamRole ?? null,
    },
    text: stripHtml(post.content ?? ''),
    createdAt: new Date(Number(post.timestamp) || Date.now()).toISOString(),
    // Deleting a real NodeBB reply from the feed isn't implemented, so the
    // delete affordance is never offered — regardless of who wrote it.
    isOwn: false,
    replies: [],
  };
}

function pidFromForumCommentUid(uid: string): number | undefined {
  const pid = Number(uid.slice('fpc_'.length));
  return uid.startsWith('fpc_') && Number.isFinite(pid) ? pid : undefined;
}

/**
 * Post a comment on a forum post as a REAL NodeBB reply — the directory backend
 * has no table to put it in.
 *
 * A top-level comment replies to the topic's opening post, a reply replies to
 * that comment's own post. `forumMainPid` comes from the card the modal was
 * opened from; the topic fetch is only a fallback for a caller that doesn't
 * have it, so the common path is one request, not two.
 */
async function createForumPostComment(request: ICreateFeedCommentRequest): Promise<IFeedComment> {
  const itemUid = request.itemUid as ForumPostUid;
  const tid = tidFromForumPostUid(itemUid);

  const parentPid = request.parentUid ? pidFromForumCommentUid(request.parentUid) : undefined;
  const toPid = parentPid ?? request.forumMainPid ?? (await fetchTopicMainPid(tid));

  const created = await postForumReply({ tid, toPid, content: `<p>${escapeHtml(request.text)}</p>` });
  const post = (created?.response ?? created) as TopicPost;

  return {
    ...toForumFeedComment(post, itemUid, toPid),
    // The mapper reads `parent.pid` off the response, which NodeBB doesn't
    // always echo. The caller's own intent is authoritative here, and the cache
    // patch depends on it landing the comment under the right parent.
    parentUid: request.parentUid ?? null,
  };
}

async function fetchTopicMainPid(tid: number): Promise<number> {
  const response = await forumFetch(`/api/topic/${tid}`);
  if (!response?.ok) throw new Error('Failed to post feed comment');

  const topic = (await response.json()) as TopicResponse;
  return topic.mainPid;
}

/** NodeBB stores post content as HTML, so member text must not be markup. */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

async function getForumPostComments(itemUid: ForumPostUid): Promise<IFeedCommentsResponse> {
  const response = await forumFetch(`/api/topic/${tidFromForumPostUid(itemUid)}`);
  if (!response?.ok) throw new Error('Failed to fetch feed comments');

  const topic = (await response.json()) as TopicResponse;
  const posts = Array.isArray(topic?.posts) ? topic.posts : [];
  // posts[0] is the topic's own opening post rather than a reply to it — the
  // same slice the /forum page takes (components/page/forum/Post/Post.tsx).
  const [mainPost, ...replies] = posts;

  return {
    items: buildCommentTree<TopicPost, IFeedComment>({
      items: replies,
      idOf: (post) => post.pid,
      // A parent that isn't in this page of replies (the opening post, or a
      // reply further up a paginated thread) resolves to a root.
      parentIdOf: (post) => post.parent?.pid,
      makeNode: (post) => toForumFeedComment(post, itemUid, topic.mainPid),
    }),
    forumTopic: {
      url: topic.cid ? `/forum/topics/${topic.cid}/${tidFromForumPostUid(itemUid)}` : null,
      // NodeBB serves one page of posts per request, so `replies` is often a
      // subset of this — the difference is what the link-out exists for.
      totalReplyCount: Math.max(0, (Number(topic.postcount) || 0) - 1),
      // Read off the opening post, since that's what a forum card's Like votes
      // on. This is the only place the viewer's own vote state is available:
      // /api/recent, which builds the card, has no per-viewer state at all.
      like: {
        likeCount: Number(mainPost?.upvotes) || 0,
        viewerHasLiked: Boolean(mainPost?.upvoted),
      },
    },
  };
}
