import { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react';

// jest.setup.js stubs useQuery globally; this hook reads a real cache entry
// through `select` and writes to another, so it needs the real implementation.
jest.unmock('@tanstack/react-query');

import { useReconcileFeedCommentCount } from '@/services/feed/hooks/useReconcileFeedCommentCount';
import { readCountFloors } from '@/services/feed/feedCommentCountFloor';
import { feedQueryKeys } from '@/services/feed/constants';
import { getFeedComments } from '@/services/feed/feed.service';
import type { IFeedCommentCountsResponse, IFeedCommentsResponse } from '@/types/feed.types';

jest.mock('@/services/feed/feed.service', () => ({ getFeedComments: jest.fn() }));
jest.mock('@/utils/third-party.helper', () => ({ getCookiesFromClient: () => ({ authToken: 'token' }) }));

const getFeedCommentsMock = getFeedComments as jest.MockedFunction<typeof getFeedComments>;

describe('useReconcileFeedCommentCount', () => {
  let client: QueryClient;

  beforeEach(() => {
    jest.clearAllMocks();
    window.sessionStorage.clear();
    client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  });

  function wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  }

  function seedThread(uid: string, totalReplyCount: number) {
    client.setQueryData<IFeedCommentsResponse>(feedQueryKeys.comments(uid), {
      items: [],
      forumTopic: {
        url: `/forum/topics/5/96`,
        totalReplyCount,
        like: { likeCount: 0, viewerHasLiked: false },
        bodyHtml: '',
      },
    });
  }

  function counts() {
    return client.getQueryData<IFeedCommentCountsResponse>(feedQueryKeys.commentCounts());
  }

  it('copies the topic’s own reply count over the listing’s stale guess', () => {
    client.setQueryData<IFeedCommentCountsResponse>(feedQueryKeys.commentCounts(), { fp_96: 0, 'news-1': 2 });
    seedThread('fp_96', 3);

    renderHook(() => useReconcileFeedCommentCount('fp_96'), { wrapper });

    // The whole point of the ticket: 0 on the card, 3 on the forum post.
    expect(counts()).toEqual({ fp_96: 3, 'news-1': 2 });
  });

  it('LOWERS the count when the topic says fewer — how a deletion recovers', () => {
    client.setQueryData<IFeedCommentCountsResponse>(feedQueryKeys.commentCounts(), { fp_96: 9 });
    seedThread('fp_96', 4);

    renderHook(() => useReconcileFeedCommentCount('fp_96'), { wrapper });

    expect(counts()).toEqual({ fp_96: 4 });
  });

  it('remembers the reconciled count so a later stale listing cannot undo it', () => {
    seedThread('fp_96', 3);

    renderHook(() => useReconcileFeedCommentCount('fp_96'), { wrapper });

    expect(readCountFloors()).toEqual({ fp_96: 3 });
  });

  it('leaves the entry untouched when it already agrees', () => {
    client.setQueryData<IFeedCommentCountsResponse>(feedQueryKeys.commentCounts(), { fp_96: 3 });
    const before = counts();
    seedThread('fp_96', 3);

    renderHook(() => useReconcileFeedCommentCount('fp_96'), { wrapper });

    // Same reference, not merely equal: an identical copy would still notify
    // every count observer on the page.
    expect(counts()).toBe(before);
  });

  it('creates the counts entry when the thread is the first thing to know', () => {
    seedThread('fp_96', 5);

    renderHook(() => useReconcileFeedCommentCount('fp_96'), { wrapper });

    expect(counts()).toEqual({ fp_96: 5 });
  });

  it('ignores a news item — its count is server-authoritative', () => {
    client.setQueryData<IFeedCommentCountsResponse>(feedQueryKeys.commentCounts(), { 'news-1': 2 });
    client.setQueryData<IFeedCommentsResponse>(feedQueryKeys.comments('news-1'), { items: [] });

    renderHook(() => useReconcileFeedCommentCount('news-1'), { wrapper });

    expect(counts()).toEqual({ 'news-1': 2 });
    expect(readCountFloors()).toEqual({});
  });

  it('does nothing before the thread has been opened', () => {
    renderHook(() => useReconcileFeedCommentCount('fp_96'), { wrapper });

    expect(counts()).toBeUndefined();
    expect(readCountFloors()).toEqual({});
  });

  it('never fetches — the thread owns the request, this only observes it', () => {
    seedThread('fp_96', 3);

    renderHook(() => useReconcileFeedCommentCount('fp_96'), { wrapper });

    expect(getFeedCommentsMock).not.toHaveBeenCalled();
  });
});
