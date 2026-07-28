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

function comment(uid: string, itemUid: string): IFeedComment {
  return {
    uid,
    itemUid,
    author: { memberUid: 'm-1', name: 'Author', avatarUrl: null, role: null },
    text: 'text',
    createdAt: '2026-01-01T00:00:00.000Z',
    isOwn: true,
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
