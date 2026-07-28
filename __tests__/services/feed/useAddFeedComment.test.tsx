import { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor, act } from '@testing-library/react';

// jest.setup.js stubs useQuery/useMutation globally; this hook needs the real
// react-query mutation lifecycle (onSuccess) to exercise the cache patch.
jest.unmock('@tanstack/react-query');

import { useAddFeedComment } from '@/services/feed/hooks/useAddFeedComment';
import { feedQueryKeys } from '@/services/feed/constants';
import { createFeedComment } from '@/services/feed/feed.service';
import type { IFeedComment, IFeedCommentCountsResponse, IFeedCommentsResponse } from '@/types/feed.types';

jest.mock('@/services/feed/feed.service', () => ({ createFeedComment: jest.fn() }));

const createFeedCommentMock = createFeedComment as jest.MockedFunction<typeof createFeedComment>;

function comment(uid: string, itemUid: string, text: string, createdAt: string): IFeedComment {
  return { uid, itemUid, author: { memberUid: 'm-1', name: 'Author', avatarUrl: null, role: null }, text, createdAt, isOwn: true };
}

describe('useAddFeedComment', () => {
  let client: QueryClient;

  beforeEach(() => {
    jest.clearAllMocks();
    client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  });

  function wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  }

  it('appends the new comment to the END of the thread — comments are oldest-first, not newest-first', async () => {
    const itemUid = 'fp_1';
    const existing: IFeedCommentsResponse = { items: [comment('c-old', itemUid, 'First', '2026-01-01T00:00:00.000Z')] };
    client.setQueryData(feedQueryKeys.comments(itemUid), existing);
    client.setQueryData<IFeedCommentCountsResponse>(feedQueryKeys.commentCounts(), { [itemUid]: 1 });

    const created = comment('c-new', itemUid, 'Second', '2026-01-02T00:00:00.000Z');
    createFeedCommentMock.mockResolvedValue(created);

    const { result } = renderHook(() => useAddFeedComment(itemUid), { wrapper });
    act(() => result.current.mutate({ text: 'Second' }));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const patched = client.getQueryData<IFeedCommentsResponse>(feedQueryKeys.comments(itemUid));
    expect(patched?.items.map((c) => c.uid)).toEqual(['c-old', 'c-new']);
    expect(client.getQueryData<IFeedCommentCountsResponse>(feedQueryKeys.commentCounts())?.[itemUid]).toBe(2);
  });

  it('seeds a fresh cache entry when no thread has been fetched yet', async () => {
    const itemUid = 'fp_2';
    const created = comment('c-1', itemUid, 'Hello', '2026-01-01T00:00:00.000Z');
    createFeedCommentMock.mockResolvedValue(created);

    const { result } = renderHook(() => useAddFeedComment(itemUid), { wrapper });
    act(() => result.current.mutate({ text: 'Hello' }));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(client.getQueryData<IFeedCommentsResponse>(feedQueryKeys.comments(itemUid))?.items).toEqual([created]);
  });
});
