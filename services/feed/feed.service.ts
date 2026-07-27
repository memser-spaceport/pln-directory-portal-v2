import { customFetch } from '@/utils/fetch-wrapper';
import { getHeader } from '@/utils/common.utils';
import type {
  ICreateFeedCommentRequest,
  IFeedAuthor,
  IFeedComment,
  IFeedCommentCountsResponse,
  IFeedCommentsResponse,
  IFeedForumPostLikeStatus,
  IFeedForumPostsResponse,
} from '@/types/feed.types';
import { FeedForumPostsForbiddenError } from './feed.errors';

// Client-side fetchers for the feed's social layer. The real API doesn't exist
// yet — every fetcher serves fixtures while NEXT_PUBLIC_MOCK_FEED_SOCIAL=true
// (checked per-call with the literal env comparison so the bundler folds it,
// and the fixture module is loaded via dynamic import so it stays out of the
// main /home chunk). Swapping to the real API means deleting the mock branches;
// signatures and types stay put.
//
// Unlike the team-news SSR fetchers, these are React Query queryFns/mutationFns:
// they THROW on failure (never return null) so isError/rollback semantics work.

export async function getFeedForumPosts(): Promise<IFeedForumPostsResponse> {
  if (process.env.NEXT_PUBLIC_MOCK_FEED_SOCIAL === 'true') {
    const { getMockForumPosts } = await import('./feed.mock-data');
    return getMockForumPosts();
  }

  const response = await customFetch(`${process.env.DIRECTORY_API_URL}/v1/feed/forum-posts`, { method: 'GET' }, true);
  // 403 = viewer lacks forum.read — an expected state (feed stays news-only),
  // typed so the hook can skip retries and callers never treat it as a failure.
  if (response?.status === 403) throw new FeedForumPostsForbiddenError();
  if (!response?.ok) throw new Error('Failed to fetch feed forum posts');
  return (await response.json()) as IFeedForumPostsResponse;
}

// Public endpoint (signed-out visitors see news comment counts), but the token
// is still sent when present — counts for fp_ uids are only included for
// viewers with forum.read.
export async function getFeedCommentCounts(uids: string[], authToken?: string): Promise<IFeedCommentCountsResponse> {
  if (process.env.NEXT_PUBLIC_MOCK_FEED_SOCIAL === 'true') {
    const { getMockCommentCounts } = await import('./feed.mock-data');
    return getMockCommentCounts(uids);
  }

  // POST body, not query string — a 14-day news window can exceed URL limits.
  const response = await fetch(`${process.env.DIRECTORY_API_URL}/v1/feed/comments/counts`, {
    method: 'POST',
    headers: { ...getHeader(authToken), 'Content-Type': 'application/json' },
    body: JSON.stringify({ uids }),
  });
  if (!response.ok) throw new Error('Failed to fetch feed comment counts');
  return (await response.json()) as IFeedCommentCountsResponse;
}

// Public for news uids; fp_ itemUids 404 without forum.read (indistinguishable
// from nonexistent — the UI never reaches here for posts the viewer can't see).
export async function getFeedComments(itemUid: string, authToken?: string): Promise<IFeedCommentsResponse> {
  if (process.env.NEXT_PUBLIC_MOCK_FEED_SOCIAL === 'true') {
    const { getMockFeedComments } = await import('./feed.mock-data');
    return getMockFeedComments(itemUid);
  }

  const response = await fetch(
    `${process.env.DIRECTORY_API_URL}/v1/feed/comments?itemUid=${encodeURIComponent(itemUid)}`,
    { headers: getHeader(authToken) },
  );
  if (!response.ok) throw new Error('Failed to fetch feed comments');
  return (await response.json()) as IFeedCommentsResponse;
}

// `mockViewer` exists only for the fixture store, which can't derive the author
// from a JWT the way the real endpoint does. The real branch ignores it.
export async function createFeedComment(
  request: ICreateFeedCommentRequest,
  mockViewer: IFeedAuthor,
): Promise<IFeedComment> {
  if (process.env.NEXT_PUBLIC_MOCK_FEED_SOCIAL === 'true') {
    const { addMockFeedComment } = await import('./feed.mock-data');
    return addMockFeedComment(request, mockViewer);
  }

  const response = await customFetch(
    `${process.env.DIRECTORY_API_URL}/v1/feed/comments`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(request) },
    true,
  );
  if (!response?.ok) throw new Error('Failed to post feed comment');
  return (await response.json()) as IFeedComment;
}

export async function toggleFeedForumPostLike(uid: string, isLiked: boolean): Promise<IFeedForumPostLikeStatus> {
  if (process.env.NEXT_PUBLIC_MOCK_FEED_SOCIAL === 'true') {
    const { toggleMockForumPostLike } = await import('./feed.mock-data');
    return toggleMockForumPostLike(uid, isLiked);
  }

  const response = await customFetch(
    `${process.env.DIRECTORY_API_URL}/v1/feed/forum-posts/${encodeURIComponent(uid)}/like`,
    { method: isLiked ? 'POST' : 'DELETE', headers: { 'Content-Type': 'application/json' } },
    true,
  );
  if (!response?.ok) throw new Error('Failed to toggle feed forum post like');
  return (await response.json()) as IFeedForumPostLikeStatus;
}
