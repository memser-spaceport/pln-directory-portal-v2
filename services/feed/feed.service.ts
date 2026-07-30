import { customFetch } from '@/utils/fetch-wrapper';
import { getHeader } from '@/utils/common.utils';
import { stripHtml } from '@/utils/forum';
import type { Topic } from '@/services/forum/hooks/useForumPosts';
import { isForumPostUid } from '@/types/feed.types';
import type {
  ForumPostUid,
  ICreateFeedCommentRequest,
  IFeedComment,
  IFeedCommentCountsResponse,
  IFeedCommentDeleteResponse,
  IFeedCommentsResponse,
  IFeedForumPost,
  IFeedForumPostLikeStatus,
  IFeedForumPostsResponse,
} from '@/types/feed.types';

// Client-side fetchers for the feed's social layer.
//
// Forum posts and their votes/likes are fetched directly from NodeBB
// (FORUM_API_URL) — the directory backend's forum-posts proxy
// (GET /v1/feed/forum-posts and its like route) was removed; see
// docs/NEWSFEED_FORUM_POSTS.md in pln-directory-portal. This reuses the same
// customFetch/env-token convention as services/forum/hooks/* (the standalone
// /forum pages), just against /api/recent instead of a category topic list.
//
// Feed comments (on a TeamNewsItem) are unaffected — still directory-native,
// still served by the directory backend.
//
// Unlike the team-news SSR fetchers, these are React Query queryFns/mutationFns:
// they THROW on failure (never return null) so isError/rollback semantics work.

// Session-scoped cache of each forum post's NodeBB main-post id (needed to
// vote on it) and last-known like count (NodeBB's vote endpoint doesn't
// return an updated count, so a toggle adjusts this by ±1 — corrected again
// on the next real fetch, same "session-frozen list" assumption
// useFeedForumPosts already relies on via staleTime: Infinity).
const forumPostByUid = new Map<ForumPostUid, { pid: number; likeCount: number }>();

function forumAuthHeaders() {
  const token = process.env.CUSTOM_FORUM_AUTH_TOKEN;
  return {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: 'include' as const,
    includeDirectoryToken: !token,
  };
}

function mapTopicToFeedForumPost(topic: Topic): IFeedForumPost {
  const uid = `fp_${topic.tid}` as ForumPostUid;
  const likeCount = Number(topic.upvotes) || 0;
  forumPostByUid.set(uid, { pid: topic.mainPid, likeCount });

  const user = topic.user ?? ({} as Topic['user']);
  return {
    uid,
    title: stripHtml(topic.titleRaw || topic.title || ''),
    body: stripHtml(topic.teaser?.content || ''),
    author: {
      memberUid: user.memberUid ?? '',
      name: user.displayname || user.username || 'Unknown',
      avatarUrl: user.picture ?? null,
      role: user.teamRole ?? null,
    },
    // No meaningful mapping from NodeBB categories onto the feed's focus-area
    // tabs — see docs/NEWSFEED_FORUM_POSTS.md, "there is no focusAreas field".
    focusAreas: [],
    category: topic.category?.name ?? '',
    createdAt: new Date(Number(topic.timestamp) || Date.now()).toISOString(),
    forumTopicUrl: `/forum/topics/${topic.cid}/${topic.tid}`,
    commentCount: Math.max(0, (Number(topic.postcount) || 0) - 1),
    likeCount,
    // /api/recent is a guest-level listing with no per-viewer vote state —
    // same limitation the removed backend proxy had.
    viewerHasLiked: false,
  };
}

export async function getFeedForumPosts(): Promise<IFeedForumPostsResponse> {
  const { includeDirectoryToken, ...init } = forumAuthHeaders();
  const response = await customFetch(`${process.env.FORUM_API_URL}/api/recent`, init, includeDirectoryToken);
  if (!response?.ok) throw new Error('Failed to fetch feed forum posts');
  const data = await response.json();
  const topics = Array.isArray(data?.topics) ? (data.topics as Topic[]) : [];
  return { items: topics.map(mapTopicToFeedForumPost) };
}

// Public endpoint (signed-out visitors see news comment counts), but the token
// is still sent when present — counts for fp_ uids are only included for
// viewers with forum.read.
export async function getFeedCommentCounts(uids: string[], authToken?: string): Promise<IFeedCommentCountsResponse> {
  // POST body, not query string — a 14-day news window can exceed URL limits.
  const response = await fetch(`${process.env.DIRECTORY_API_URL}/v1/feed/comments/counts`, {
    method: 'POST',
    headers: { ...getHeader(authToken), 'Content-Type': 'application/json' },
    body: JSON.stringify({ uids }),
  });
  if (!response.ok) throw new Error('Failed to fetch feed comment counts');
  const { counts } = (await response.json()) as { counts: IFeedCommentCountsResponse };
  return counts;
}

// Public for news uids; fp_ itemUids 404 without forum.read (indistinguishable
// from nonexistent — the UI never reaches here for posts the viewer can't see).
export async function getFeedComments(itemUid: string, authToken?: string): Promise<IFeedCommentsResponse> {
  if (isForumPostUid(itemUid)) return getForumPostComments(itemUid);

  const response = await fetch(
    `${process.env.DIRECTORY_API_URL}/v1/feed/comments?itemUid=${encodeURIComponent(itemUid)}`,
    { headers: getHeader(authToken) },
  );
  if (!response.ok) throw new Error('Failed to fetch feed comments');
  return (await response.json()) as IFeedCommentsResponse;
}

export async function createFeedComment(request: ICreateFeedCommentRequest): Promise<IFeedComment> {
  if (isForumPostUid(request.itemUid)) return createForumPostComment(request.itemUid, request.text);

  const response = await customFetch(
    `${process.env.DIRECTORY_API_URL}/v1/feed/comments`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(request) },
    true,
  );
  if (!response?.ok) throw new Error('Failed to post feed comment');
  return (await response.json()) as IFeedComment;
}

// A forum post's "comments" are its real NodeBB replies — read/written
// straight against the Forum, same as its votes/likes above. There's no
// reply-to-a-specific-comment UI yet (see docs/NEWSFEED_FORUM_POSTS.md), so
// every new comment replies to the topic's own opening post (mainPid), same
// as the top-level composer on the standalone /forum page
// (components/page/forum/PostComments/PostComments.tsx).
//
// isOwn is always false here (never surfaced as "yours") because deleting a
// real NodeBB reply isn't implemented — that's a separate, larger feature
// (author-permission-checked DELETE against NodeBB's own write API).

function tidFromForumPostUid(uid: ForumPostUid): number {
  return Number(uid.slice(3));
}

async function getMainPid(uid: ForumPostUid): Promise<number> {
  const cached = forumPostByUid.get(uid);
  if (cached) return cached.pid;

  // Cache miss (e.g. commenting resolved before the posts list finished
  // fetching) — fall back to fetching the topic directly.
  const { includeDirectoryToken, ...init } = forumAuthHeaders();
  const response = await customFetch(
    `${process.env.FORUM_API_URL}/api/topic/${tidFromForumPostUid(uid)}`,
    init,
    includeDirectoryToken,
  );
  if (!response?.ok) throw new Error('Failed to post feed comment');
  const topic = await response.json();
  return topic.mainPid;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function mapForumPostToFeedComment(post: any, itemUid: ForumPostUid): IFeedComment {
  const user = post.user ?? {};
  return {
    uid: `fpc_${post.pid}`,
    itemUid,
    author: {
      memberUid: user.memberUid ?? '',
      name: user.displayname || user.username || 'Unknown',
      avatarUrl: user.picture ?? null,
      role: user.teamRole ?? null,
    },
    text: stripHtml(post.content ?? ''),
    createdAt: new Date(Number(post.timestamp) || Date.now()).toISOString(),
    isOwn: false,
  };
}

async function getForumPostComments(uid: ForumPostUid): Promise<IFeedCommentsResponse> {
  const { includeDirectoryToken, ...init } = forumAuthHeaders();
  const response = await customFetch(
    `${process.env.FORUM_API_URL}/api/topic/${tidFromForumPostUid(uid)}`,
    init,
    includeDirectoryToken,
  );
  if (!response?.ok) throw new Error('Failed to fetch feed comments');
  const topic = await response.json();
  const posts = Array.isArray(topic?.posts) ? topic.posts : [];
  // posts[0] is the topic's own opening post, not a reply to it.
  return { items: posts.slice(1).map((post: any) => mapForumPostToFeedComment(post, uid)) };
}

async function createForumPostComment(uid: ForumPostUid, text: string): Promise<IFeedComment> {
  const toPid = await getMainPid(uid);
  const { includeDirectoryToken, ...init } = forumAuthHeaders();
  const response = await customFetch(
    `${process.env.FORUM_API_URL}/api/v3/topics/${tidFromForumPostUid(uid)}`,
    { ...init, method: 'POST', body: JSON.stringify({ content: `<p>${escapeHtml(text)}</p>`, toPid }) },
    includeDirectoryToken,
  );
  if (!response?.ok) throw new Error('Failed to post feed comment');
  const data = await response.json();
  return mapForumPostToFeedComment(data?.response ?? data, uid);
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

// PUT adds a vote (NodeBB write API v3), DELETE removes it — mirrors
// services/forum/hooks/useLikePost.ts's PUT, with the symmetric unvote call
// it doesn't need (that hook only ever likes, never unlikes).
export async function toggleFeedForumPostLike(uid: string, isLiked: boolean): Promise<IFeedForumPostLikeStatus> {
  const cached = forumPostByUid.get(uid as ForumPostUid);
  if (!cached) throw new Error('Failed to toggle feed forum post like');

  const { includeDirectoryToken, ...init } = forumAuthHeaders();
  const response = await customFetch(
    `${process.env.FORUM_API_URL}/api/v3/posts/${cached.pid}/vote`,
    {
      ...init,
      method: isLiked ? 'PUT' : 'DELETE',
      ...(isLiked ? { body: JSON.stringify({ delta: 1 }) } : {}),
    },
    includeDirectoryToken,
  );
  if (!response?.ok) throw new Error('Failed to toggle feed forum post like');

  cached.likeCount = isLiked ? cached.likeCount + 1 : Math.max(0, cached.likeCount - 1);
  return { likeCount: cached.likeCount, viewerHasLiked: isLiked };
}
