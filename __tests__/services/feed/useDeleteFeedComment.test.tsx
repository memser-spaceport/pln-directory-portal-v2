import { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor, act } from '@testing-library/react';

jest.unmock('@tanstack/react-query');

import { useDeleteFeedComment } from '@/services/feed/hooks/useDeleteFeedComment';
import { readCountFloors, writeCountFloor } from '@/services/feed/feedCommentCountFloor';
import { feedQueryKeys } from '@/services/feed/constants';
import { deleteFeedComment, FeedWriteError } from '@/services/feed/feed.service';
import type { IFeedComment, IFeedCommentCountsResponse, IFeedCommentsResponse } from '@/types/feed.types';

jest.mock('@/services/feed/feed.service', () => ({
  ...jest.requireActual('@/services/feed/feed.service'),
  deleteFeedComment: jest.fn(),
}));

const onFeedCommentDeleted = jest.fn();
const onFeedCommentDeleteFailed = jest.fn();
jest.mock('@/analytics/team-news.analytics', () => ({
  useTeamNewsAnalytics: () => ({ onFeedCommentDeleted, onFeedCommentDeleteFailed }),
}));

const CONTEXT = { kind: 'news', source: 'home' } as const;

const deleteFeedCommentMock = deleteFeedComment as jest.MockedFunction<typeof deleteFeedComment>;

function comment(
  uid: string,
  itemUid: string,
  parentUid: string | null = null,
  replies: IFeedComment[] = [],
): IFeedComment {
  return {
    uid,
    itemUid,
    parentUid,
    author: { uid: 'm-1', name: 'Author', avatarUrl: null },
    text: 'text',
    createdAt: '2026-01-01T00:00:00.000Z',
    isOwn: true,
    replies,
  };
}

describe('useDeleteFeedComment', () => {
  let client: QueryClient;

  beforeEach(() => {
    jest.clearAllMocks();
    window.sessionStorage.clear();
    client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  });

  function wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  }

  it('removes the comment from the thread and decrements the shared count', async () => {
    const itemUid = 'fp_1';
    const existing: IFeedCommentsResponse = { items: [comment('c-1', itemUid), comment('c-2', itemUid)] };
    client.setQueryData(feedQueryKeys.comments(itemUid), existing);
    client.setQueryData<IFeedCommentCountsResponse>(feedQueryKeys.commentCounts(), { [itemUid]: 2 });
    deleteFeedCommentMock.mockResolvedValue({ uid: 'c-1', deleted: true });

    const { result } = renderHook(() => useDeleteFeedComment(itemUid), { wrapper });
    act(() => result.current.mutate({ commentUid: 'c-1' }));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const patched = client.getQueryData<IFeedCommentsResponse>(feedQueryKeys.comments(itemUid));
    expect(patched?.items.map((c) => c.uid)).toEqual(['c-2']);
    expect(client.getQueryData<IFeedCommentCountsResponse>(feedQueryKeys.commentCounts())?.[itemUid]).toBe(1);
  });

  it('floors the shared count at 0 rather than going negative', async () => {
    const itemUid = 'fp_2';
    client.setQueryData(feedQueryKeys.comments(itemUid), { items: [comment('c-1', itemUid)] } as IFeedCommentsResponse);
    client.setQueryData<IFeedCommentCountsResponse>(feedQueryKeys.commentCounts(), { [itemUid]: 0 });
    deleteFeedCommentMock.mockResolvedValue({ uid: 'c-1', deleted: true });

    const { result } = renderHook(() => useDeleteFeedComment(itemUid), { wrapper });
    act(() => result.current.mutate({ commentUid: 'c-1' }));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(client.getQueryData<IFeedCommentCountsResponse>(feedQueryKeys.commentCounts())?.[itemUid]).toBe(0);
  });

  it('preserves forumTopic on the entry — the patch must not rebuild it from items alone', async () => {
    const itemUid = 'fp_3';
    const forumTopic = {
      url: '/forum/topics/5/96',
      totalReplyCount: 40,
      like: { likeCount: 3, viewerHasLiked: true },
    };
    client.setQueryData<IFeedCommentsResponse>(feedQueryKeys.comments(itemUid), {
      items: [comment('c-1', itemUid), comment('c-2', itemUid)],
      forumTopic,
    });
    deleteFeedCommentMock.mockResolvedValue({ uid: 'c-1', deleted: true });

    const { result } = renderHook(() => useDeleteFeedComment(itemUid), { wrapper });
    act(() => result.current.mutate({ commentUid: 'c-1' }));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // totalReplyCount drops with the removed subtree, for the same reason the
    // add mutation raises it: useReconcileFeedCommentCount re-applies this
    // field on every thread mount, so a stale value here would undo the delete.
    expect(client.getQueryData<IFeedCommentsResponse>(feedQueryKeys.comments(itemUid))?.forumTopic).toEqual({
      ...forumTopic,
      totalReplyCount: 39,
    });
  });

  it('LOWERS what it remembers, so the next seed cannot push the count back up', async () => {
    const itemUid = 'fp_3';
    writeCountFloor(itemUid, 3);
    client.setQueryData<IFeedCommentsResponse>(feedQueryKeys.comments(itemUid), {
      items: [comment('c-1', itemUid), comment('c-2', itemUid), comment('c-3', itemUid)],
    });
    client.setQueryData<IFeedCommentCountsResponse>(feedQueryKeys.commentCounts(), { [itemUid]: 3 });
    deleteFeedCommentMock.mockResolvedValue({ uid: 'c-1', deleted: true });

    const { result } = renderHook(() => useDeleteFeedComment(itemUid), { wrapper });
    act(() => result.current.mutate({ commentUid: 'c-1' }));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(readCountFloors()).toEqual({ [itemUid]: 2 });
  });

  it('removes a nested reply without disturbing its siblings', async () => {
    const itemUid = 'n-1';
    client.setQueryData<IFeedCommentsResponse>(feedQueryKeys.comments(itemUid), {
      items: [comment('c-1', itemUid, null, [comment('c-2', itemUid, 'c-1'), comment('c-3', itemUid, 'c-1')])],
    });
    client.setQueryData<IFeedCommentCountsResponse>(feedQueryKeys.commentCounts(), { [itemUid]: 3 });
    deleteFeedCommentMock.mockResolvedValue({ uid: 'c-2', deleted: true });

    const { result } = renderHook(() => useDeleteFeedComment(itemUid), { wrapper });
    act(() => result.current.mutate({ commentUid: 'c-2' }));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const patched = client.getQueryData<IFeedCommentsResponse>(feedQueryKeys.comments(itemUid));
    expect(patched?.items[0].replies.map((c) => c.uid)).toEqual(['c-3']);
    expect(client.getQueryData<IFeedCommentCountsResponse>(feedQueryKeys.commentCounts())?.[itemUid]).toBe(2);
  });

  it('drops the count by the WHOLE subtree — the backend cascades replies', async () => {
    const itemUid = 'n-1';
    // c-1 > c-2 > c-3, plus an unrelated c-4: deleting c-1 deletes three rows.
    client.setQueryData<IFeedCommentsResponse>(feedQueryKeys.comments(itemUid), {
      items: [
        comment('c-1', itemUid, null, [comment('c-2', itemUid, 'c-1', [comment('c-3', itemUid, 'c-2')])]),
        comment('c-4', itemUid),
      ],
    });
    client.setQueryData<IFeedCommentCountsResponse>(feedQueryKeys.commentCounts(), { [itemUid]: 4 });
    deleteFeedCommentMock.mockResolvedValue({ uid: 'c-1', deleted: true });

    const { result } = renderHook(() => useDeleteFeedComment(itemUid), { wrapper });
    act(() => result.current.mutate({ commentUid: 'c-1' }));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(
      client.getQueryData<IFeedCommentsResponse>(feedQueryKeys.comments(itemUid))?.items.map((c) => c.uid),
    ).toEqual(['c-4']);
    // Decrementing by 1 would leave the badge permanently overstated at 3.
    expect(client.getQueryData<IFeedCommentCountsResponse>(feedQueryKeys.commentCounts())?.[itemUid]).toBe(1);
  });

  it('leaves the count alone when the comment was never in the cached thread', async () => {
    const itemUid = 'n-1';
    client.setQueryData<IFeedCommentsResponse>(feedQueryKeys.comments(itemUid), { items: [comment('c-1', itemUid)] });
    client.setQueryData<IFeedCommentCountsResponse>(feedQueryKeys.commentCounts(), { [itemUid]: 1 });
    // Already deleted in another tab — the service maps the 404 to a success.
    deleteFeedCommentMock.mockResolvedValue({ uid: 'gone', deleted: true });

    const { result } = renderHook(() => useDeleteFeedComment(itemUid), { wrapper });
    act(() => result.current.mutate({ commentUid: 'gone' }));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(client.getQueryData<IFeedCommentCountsResponse>(feedQueryKeys.commentCounts())?.[itemUid]).toBe(1);
    expect(client.getQueryData<IFeedCommentsResponse>(feedQueryKeys.comments(itemUid))?.items).toHaveLength(1);
  });

  it('surfaces isError so the UI can show an inline retry message', async () => {
    const itemUid = 'fp_3';
    client.setQueryData(feedQueryKeys.comments(itemUid), { items: [comment('c-1', itemUid)] } as IFeedCommentsResponse);
    deleteFeedCommentMock.mockRejectedValue(new Error('Failed to delete feed comment'));

    const { result } = renderHook(() => useDeleteFeedComment(itemUid), { wrapper });
    act(() => result.current.mutate({ commentUid: 'c-1' }));

    await waitFor(() => expect(result.current.isError).toBe(true));
    // Nothing removed from the cache on failure — no optimistic pre-removal.
    expect(client.getQueryData<IFeedCommentsResponse>(feedQueryKeys.comments(itemUid))?.items).toHaveLength(1);
  });
});

describe('useDeleteFeedComment — analytics', () => {
  let client: QueryClient;

  beforeEach(() => {
    jest.clearAllMocks();
    window.sessionStorage.clear();
    client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  });

  function wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  }

  it('reports the size of the removed subtree, not just that a delete happened', async () => {
    const itemUid = 'n-1';
    client.setQueryData<IFeedCommentsResponse>(feedQueryKeys.comments(itemUid), {
      items: [comment('c-1', itemUid, null, [comment('c-2', itemUid, 'c-1'), comment('c-3', itemUid, 'c-1')])],
    });
    deleteFeedCommentMock.mockResolvedValue({ uid: 'c-1', deleted: true });

    const { result } = renderHook(() => useDeleteFeedComment(itemUid, CONTEXT), { wrapper });
    act(() => result.current.mutate({ commentUid: 'c-1' }));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Deleting a leaf and deleting a whole conversation are different acts.
    expect(onFeedCommentDeleted).toHaveBeenCalledWith(itemUid, 'news', 'home', 3);
  });

  it('reports removedCount 0 for a comment that was already gone', async () => {
    // The service maps 404 to success, so a double-delete from another tab
    // lands here. Reporting 0 keeps it from inflating the delete count.
    deleteFeedCommentMock.mockResolvedValue({ uid: 'c-9', deleted: true });

    const { result } = renderHook(() => useDeleteFeedComment('n-1', CONTEXT), { wrapper });
    act(() => result.current.mutate({ commentUid: 'c-9' }));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(onFeedCommentDeleted).toHaveBeenCalledWith('n-1', 'news', 'home', 0);
  });

  it('reports a delete failure with a classified reason', async () => {
    deleteFeedCommentMock.mockRejectedValue(new FeedWriteError('Failed to delete feed comment', undefined));

    const { result } = renderHook(() => useDeleteFeedComment('n-1', CONTEXT), { wrapper });
    act(() => result.current.mutate({ commentUid: 'c-1' }));

    await waitFor(() => expect(result.current.isError).toBe(true));

    // No status means customFetch gave up on auth, not that nothing is known.
    expect(onFeedCommentDeleteFailed).toHaveBeenCalledWith('n-1', 'news', 'home', { reason: 'session-expired' });
  });
});
