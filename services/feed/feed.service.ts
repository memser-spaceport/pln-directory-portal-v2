import { customFetch } from '@/utils/fetch-wrapper';
import { getHeader } from '@/utils/common.utils';
import type {
  ICreateFeedCommentRequest,
  IFeedComment,
  IFeedCommentCountsResponse,
  IFeedCommentDeleteResponse,
  IFeedCommentsResponse,
  IFeedForumPostLikeStatus,
  IFeedForumPostsResponse,
} from '@/types/feed.types';

// Client-side fetchers for the feed's social layer, against the real
// /v1/feed API (docs/NEWSFEED_FORUM_POSTS.md, LAB-2175).
//
// Unlike the team-news SSR fetchers, these are React Query queryFns/mutationFns:
// they THROW on failure (never return null) so isError/rollback semantics work.

export async function getFeedForumPosts(): Promise<IFeedForumPostsResponse> {
  // limit=100 (the API max) is a single bounded fetch, not true pagination —
  // mergeFeedEntries rank-merges the whole array in one shot against a
  // session-frozen feed, so there's no stable-append strategy to page into.
  const response = await customFetch(
    `${process.env.DIRECTORY_API_URL}/v1/feed/forum-posts?limit=100&page=0`,
    { method: 'GET' },
    true,
  );
  if (!response?.ok) throw new Error('Failed to fetch feed forum posts');
  return (await response.json()) as IFeedForumPostsResponse;
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
  const response = await fetch(
    `${process.env.DIRECTORY_API_URL}/v1/feed/comments?itemUid=${encodeURIComponent(itemUid)}`,
    { headers: getHeader(authToken) },
  );
  if (!response.ok) throw new Error('Failed to fetch feed comments');
  return (await response.json()) as IFeedCommentsResponse;
}

export async function createFeedComment(request: ICreateFeedCommentRequest): Promise<IFeedComment> {
  const response = await customFetch(
    `${process.env.DIRECTORY_API_URL}/v1/feed/comments`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(request) },
    true,
  );
  if (!response?.ok) throw new Error('Failed to post feed comment');
  return (await response.json()) as IFeedComment;
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

export async function toggleFeedForumPostLike(uid: string, isLiked: boolean): Promise<IFeedForumPostLikeStatus> {
  const response = await customFetch(
    `${process.env.DIRECTORY_API_URL}/v1/feed/forum-posts/${encodeURIComponent(uid)}/like`,
    { method: isLiked ? 'POST' : 'DELETE', headers: { 'Content-Type': 'application/json' } },
    true,
  );
  if (!response?.ok) throw new Error('Failed to toggle feed forum post like');
  return (await response.json()) as IFeedForumPostLikeStatus;
}
