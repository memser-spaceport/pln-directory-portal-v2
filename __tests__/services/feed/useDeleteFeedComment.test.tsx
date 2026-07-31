import { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor, act } from '@testing-library/react';

jest.unmock('@tanstack/react-query');

import { useDeleteFeedComment } from '@/services/feed/hooks/useDeleteFeedComment';
import { feedQueryKeys } from '@/services/feed/constants';
import { deleteFeedComment } from '@/services/feed/feed.service';
import type { IFeedComment, IFeedCommentCountsResponse, IFeedCommentsResponse } from '@/types/feed.types';

jest.mock('@/services/feed/feed.service', () => ({ deleteFeedComment: jest.fn() }));

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

    expect(client.getQueryData<IFeedCommentsResponse>(feedQueryKeys.comments(itemUid))?.forumTopic).toEqual(forumTopic);
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
