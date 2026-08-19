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
import type { IFeedComment, IFeedCommentCountsResponse, IFeedCommentsResponse } from '@/types/feed.types';

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

  /** A news thread carries no forumTopic — its loaded tree IS the count. */
  function seedNewsThread(uid: string, items: IFeedComment[]) {
    client.setQueryData<IFeedCommentsResponse>(feedQueryKeys.comments(uid), { items });
  }

  function newsComment(uid: string, replies: IFeedComment[] = []): IFeedComment {
    return {
      uid,
      itemUid: 'news-1',
      parentUid: null,
      author: { uid: `m-${uid}`, name: `Author ${uid}`, avatarUrl: null },
      text: `Comment ${uid}`,
      createdAt: '2026-08-01T00:00:00.000Z',
      isOwn: false,
      replies,
    };
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

  it('reconciles a news item from its loaded tree — the counts entry is the stale one', () => {
    // Fetched once per session and then held at staleTime: Infinity, so the
    // moment anybody else comments the card is behind and the thread is not.
    client.setQueryData<IFeedCommentCountsResponse>(feedQueryKeys.commentCounts(), { 'news-1': 2 });
    seedNewsThread('news-1', [newsComment('c1'), newsComment('c2'), newsComment('c3')]);

    renderHook(() => useReconcileFeedCommentCount('news-1'), { wrapper });

    expect(counts()).toEqual({ 'news-1': 3 });
  });

  it('counts a news item’s replies at any depth, not just its top-level comments', () => {
    seedNewsThread('news-1', [newsComment('c1', [newsComment('r1', [newsComment('r2')])]), newsComment('c2')]);

    renderHook(() => useReconcileFeedCommentCount('news-1'), { wrapper });

    expect(counts()).toEqual({ 'news-1': 4 });
  });

  it('takes a news item to 0 — the count the counts endpoint cannot express', () => {
    // Its groupBy emits no row for a zero-comment item, so the fetched entry
    // can only ever omit the uid. Reconciling is the one path that writes 0.
    client.setQueryData<IFeedCommentCountsResponse>(feedQueryKeys.commentCounts(), { 'news-1': 1 });
    seedNewsThread('news-1', []);

    renderHook(() => useReconcileFeedCommentCount('news-1'), { wrapper });

    expect(counts()).toEqual({ 'news-1': 0 });
  });

  it('remembers no floor for a news item — that exists for NodeBB staleness only', () => {
    seedNewsThread('news-1', [newsComment('c1')]);

    renderHook(() => useReconcileFeedCommentCount('news-1'), { wrapper });

    expect(readCountFloors()).toEqual({});
  });

  it('leaves a news entry alone when the cache holds no items — a partial write is not an empty thread', () => {
    client.setQueryData<IFeedCommentCountsResponse>(feedQueryKeys.commentCounts(), { 'news-1': 2 });
    client.setQueryData(feedQueryKeys.comments('news-1'), {} as IFeedCommentsResponse);

    renderHook(() => useReconcileFeedCommentCount('news-1'), { wrapper });

    // Reporting 0 here would read as "every comment on this item was deleted".
    expect(counts()).toEqual({ 'news-1': 2 });
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
