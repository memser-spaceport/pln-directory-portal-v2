import { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor, act } from '@testing-library/react';

// jest.setup.js stubs useQuery/useMutation globally; this hook needs the real
// react-query mutation lifecycle (onSuccess) to exercise the cache patch.
jest.unmock('@tanstack/react-query');

import { useAddFeedComment } from '@/services/feed/hooks/useAddFeedComment';
import { feedQueryKeys } from '@/services/feed/constants';
import { createFeedComment, FeedWriteError } from '@/services/feed/feed.service';
import type { IFeedComment, IFeedCommentCountsResponse, IFeedCommentsResponse } from '@/types/feed.types';

jest.mock('@/services/feed/feed.service', () => ({
  ...jest.requireActual('@/services/feed/feed.service'),
  createFeedComment: jest.fn(),
}));

const onFeedCommentSubmitted = jest.fn();
const onFeedCommentFailed = jest.fn();
jest.mock('@/analytics/team-news.analytics', () => ({
  useTeamNewsAnalytics: () => ({ onFeedCommentSubmitted, onFeedCommentFailed }),
}));

const CONTEXT = { kind: 'news', source: 'home' } as const;

const createFeedCommentMock = createFeedComment as jest.MockedFunction<typeof createFeedComment>;

function comment(
  uid: string,
  itemUid: string,
  text: string,
  createdAt: string,
  parentUid: string | null = null,
  replies: IFeedComment[] = [],
): IFeedComment {
  return {
    uid,
    itemUid,
    parentUid,
    author: { uid: 'm-1', name: 'Author', avatarUrl: null },
    text,
    createdAt,
    isOwn: true,
    replies,
  };
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

  it('passes parentUid through to the service so a reply is created as a reply', async () => {
    const itemUid = 'n-1';
    createFeedCommentMock.mockResolvedValue(comment('c-2', itemUid, 'Agreed', '2026-01-02T00:00:00.000Z', 'c-1'));

    const { result } = renderHook(() => useAddFeedComment(itemUid), { wrapper });
    act(() => result.current.mutate({ text: 'Agreed', parentUid: 'c-1' }));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(createFeedCommentMock).toHaveBeenCalledWith({ itemUid, parentUid: 'c-1', text: 'Agreed' });
  });

  it('nests a reply under its parent instead of appending it to the root list', async () => {
    const itemUid = 'n-1';
    client.setQueryData<IFeedCommentsResponse>(feedQueryKeys.comments(itemUid), {
      items: [comment('c-1', itemUid, 'First', '2026-01-01T00:00:00.000Z')],
    });
    client.setQueryData<IFeedCommentCountsResponse>(feedQueryKeys.commentCounts(), { [itemUid]: 1 });

    const reply = comment('c-2', itemUid, 'Agreed', '2026-01-02T00:00:00.000Z', 'c-1');
    createFeedCommentMock.mockResolvedValue(reply);

    const { result } = renderHook(() => useAddFeedComment(itemUid), { wrapper });
    act(() => result.current.mutate({ text: 'Agreed', parentUid: 'c-1' }));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const patched = client.getQueryData<IFeedCommentsResponse>(feedQueryKeys.comments(itemUid));
    // The reply must NOT become a second top-level comment — that's the failure
    // mode a flat append produces, and it looks correct until you reload.
    expect(patched?.items.map((c) => c.uid)).toEqual(['c-1']);
    expect(patched?.items[0].replies.map((c) => c.uid)).toEqual(['c-2']);
    // Counts include replies at any depth.
    expect(client.getQueryData<IFeedCommentCountsResponse>(feedQueryKeys.commentCounts())?.[itemUid]).toBe(2);
  });

  it('preserves forumTopic on the entry — the patch must not rebuild it from items alone', async () => {
    const itemUid = 'fp_3';
    const forumTopic = {
      url: '/forum/topics/5/96',
      totalReplyCount: 40,
      like: { likeCount: 3, viewerHasLiked: true },
    };
    client.setQueryData<IFeedCommentsResponse>(feedQueryKeys.comments(itemUid), {
      items: [comment('c-1', itemUid, 'First', '2026-01-01T00:00:00.000Z')],
      forumTopic,
    });

    createFeedCommentMock.mockResolvedValue(comment('c-2', itemUid, 'Second', '2026-01-02T00:00:00.000Z'));

    const { result } = renderHook(() => useAddFeedComment(itemUid), { wrapper });
    act(() => result.current.mutate({ text: 'Second' }));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Dropping forumTopic silently kills the "N more comments on the forum"
    // link, the escalation label's honesty about unloaded replies, and
    // useFeedForumTopicLike's view of the vote state.
    expect(client.getQueryData<IFeedCommentsResponse>(feedQueryKeys.comments(itemUid))?.forumTopic).toEqual(forumTopic);
  });

  it('nests a reply-to-a-reply under the right comment, several levels down', async () => {
    const itemUid = 'n-1';
    client.setQueryData<IFeedCommentsResponse>(feedQueryKeys.comments(itemUid), {
      items: [
        comment('c-1', itemUid, 'First', '2026-01-01T00:00:00.000Z', null, [
          comment('c-2', itemUid, 'Agreed', '2026-01-02T00:00:00.000Z', 'c-1'),
        ]),
      ],
    });

    createFeedCommentMock.mockResolvedValue(comment('c-3', itemUid, 'Same', '2026-01-03T00:00:00.000Z', 'c-2'));

    const { result } = renderHook(() => useAddFeedComment(itemUid), { wrapper });
    act(() => result.current.mutate({ text: 'Same', parentUid: 'c-2' }));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const patched = client.getQueryData<IFeedCommentsResponse>(feedQueryKeys.comments(itemUid));
    expect(patched?.items[0].replies[0].replies.map((c) => c.uid)).toEqual(['c-3']);
  });
});

describe('useAddFeedComment — analytics', () => {
  let client: QueryClient;

  beforeEach(() => {
    jest.clearAllMocks();
    client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  });

  function wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  }

  it('reports a submitted comment from the HOOK, so a remount cannot swallow it', async () => {
    const itemUid = 'n-1';
    createFeedCommentMock.mockResolvedValue(comment('c-1', itemUid, 'Hi', '2026-01-01T00:00:00.000Z'));

    const { result } = renderHook(() => useAddFeedComment(itemUid, undefined, CONTEXT), { wrapper });
    act(() => result.current.mutate({ text: '<p>hi <a class="ql-mention" data-uid="m_7">@Jane</a></p>' }));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // isReply false, one mention counted off the anchor class.
    expect(onFeedCommentSubmitted).toHaveBeenCalledWith(itemUid, 'news', 'home', false, 1);
  });

  it('reports a reply as a reply, taking isReply from the mutation variables', async () => {
    const itemUid = 'n-1';
    createFeedCommentMock.mockResolvedValue(comment('c-2', itemUid, 'Yes', '2026-01-02T00:00:00.000Z', 'c-1'));

    const { result } = renderHook(() => useAddFeedComment(itemUid, undefined, CONTEXT), { wrapper });
    act(() => result.current.mutate({ text: '<p>yes</p>', parentUid: 'c-1' }));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(onFeedCommentSubmitted).toHaveBeenCalledWith(itemUid, 'news', 'home', true, 0);
  });

  it('reports a failure with a classified reason and status', async () => {
    createFeedCommentMock.mockRejectedValue(new FeedWriteError('Failed to post feed comment', 429));

    const { result } = renderHook(() => useAddFeedComment('n-1', undefined, CONTEXT), { wrapper });
    act(() => result.current.mutate({ text: '<p>too fast</p>' }));

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(onFeedCommentFailed).toHaveBeenCalledWith('n-1', 'news', 'home', false, {
      reason: 'rate-limited',
      status: 429,
      errorKey: undefined,
    });
    expect(onFeedCommentSubmitted).not.toHaveBeenCalled();
  });

  it('fires exactly once per mutation, not once per render', async () => {
    createFeedCommentMock.mockResolvedValue(comment('c-1', 'n-1', 'Hi', '2026-01-01T00:00:00.000Z'));

    const { result, rerender } = renderHook(() => useAddFeedComment('n-1', undefined, CONTEXT), { wrapper });
    act(() => result.current.mutate({ text: '<p>hi</p>' }));
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    rerender();
    rerender();

    expect(onFeedCommentSubmitted).toHaveBeenCalledTimes(1);
  });

  it('reports nothing when no surface context was given', async () => {
    createFeedCommentMock.mockResolvedValue(comment('c-1', 'n-1', 'Hi', '2026-01-01T00:00:00.000Z'));

    const { result } = renderHook(() => useAddFeedComment('n-1'), { wrapper });
    act(() => result.current.mutate({ text: '<p>hi</p>' }));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(onFeedCommentSubmitted).not.toHaveBeenCalled();
  });
});
