import { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react';

// jest.setup.js stubs useQuery globally; this is all about what actually lands
// in the shared counts cache entry, so it needs the real client.
jest.unmock('@tanstack/react-query');

import { useFeedSocial } from '@/components/page/home/TeamNews/hooks/useFeedSocial';
import { readCountFloors, writeCountFloor } from '@/services/feed/feedCommentCountFloor';
import { feedQueryKeys } from '@/services/feed/constants';
import type { IFeedCommentCountsResponse, IFeedForumPost } from '@/types/feed.types';

const mockPostsQuery = jest.fn();
const mockCountsQuery = jest.fn();

jest.mock('@/services/auth/store', () => ({
  useCurrentUserStore: () => ({ currentUser: { uid: 'm-1' }, isHydrated: true }),
}));
jest.mock('@/services/access-control/hooks/useForumAccess', () => ({
  useForumAccess: () => ({ hasAccess: true, isLoading: false, isPending: false, isError: false }),
}));
jest.mock('@/services/feed/hooks/useFeedForumPosts', () => ({
  useFeedForumPosts: () => mockPostsQuery(),
}));
jest.mock('@/services/feed/hooks/useFeedCommentCounts', () => ({
  useFeedCommentCounts: () => mockCountsQuery(),
}));

function post(uid: string, commentCount: number): IFeedForumPost {
  return {
    uid,
    tid: Number(uid.replace('fp_', '')),
    mainPid: 1,
    title: 'A topic',
    body: '',
    author: { memberUid: 'm-2', name: 'Author', avatarUrl: null, role: null },
    focusAreas: [],
    category: 'General',
    createdAt: new Date().toISOString(),
    lastActivityAt: new Date().toISOString(),
    forumTopicUrl: '/forum/topics/5/1',
    commentCount,
    likeCount: 0,
    viewCount: 0,
    viewerHasLiked: false,
  };
}

describe('useFeedSocial — forum comment counts', () => {
  let client: QueryClient;

  beforeEach(() => {
    jest.clearAllMocks();
    window.sessionStorage.clear();
    client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    mockPostsQuery.mockReturnValue({ data: undefined, isPending: false, isError: false });
    mockCountsQuery.mockReturnValue({ data: undefined });
  });

  function wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  }

  function counts() {
    return client.getQueryData<IFeedCommentCountsResponse>(feedQueryKeys.commentCounts());
  }

  function render(newsUids: string[] = ['news-1']) {
    return renderHook(() => useFeedSocial({ newsUids }), { wrapper });
  }

  it('seeds forum-post counts out of the posts response', () => {
    mockPostsQuery.mockReturnValue({ data: { items: [post('fp_1', 2)] }, isPending: false, isError: false });

    render();

    expect(counts()).toEqual({ fp_1: 2 });
  });

  it('restores fp_ counts after the news-counts response replaces the entry', () => {
    mockPostsQuery.mockReturnValue({ data: { items: [post('fp_1', 2)] }, isPending: false, isError: false });
    const { rerender } = render();
    expect(counts()).toEqual({ fp_1: 2 });

    // What the real query does when it resolves: the fetcher only asks for NEWS
    // uids, and React Query REPLACES the whole entry with that response. Before
    // this was watched, every fp_ count died here for the rest of the session.
    client.setQueryData<IFeedCommentCountsResponse>(feedQueryKeys.commentCounts(), { 'news-1': 5 });
    mockCountsQuery.mockReturnValue({ data: { 'news-1': 5 } });
    rerender();

    expect(counts()).toEqual({ fp_1: 2, 'news-1': 5 });
  });

  it('holds the count up when the listing is still reporting a stale postcount', () => {
    // The reported bug: comment, reload, and /api/recent still says 0.
    writeCountFloor('fp_1', 4);
    mockPostsQuery.mockReturnValue({ data: { items: [post('fp_1', 0)] }, isPending: false, isError: false });

    render();

    expect(counts()).toEqual({ fp_1: 4 });
  });

  it('follows the listing up once it overtakes the floor, and remembers the new number', () => {
    writeCountFloor('fp_1', 3);
    mockPostsQuery.mockReturnValue({ data: { items: [post('fp_1', 5)] }, isPending: false, isError: false });

    render();

    expect(counts()).toEqual({ fp_1: 5 });
    expect(readCountFloors()).toEqual({ fp_1: 5 });
  });

  it('never lets the seed overwrite a count the viewer already moved', () => {
    client.setQueryData<IFeedCommentCountsResponse>(feedQueryKeys.commentCounts(), { fp_1: 7 });
    mockPostsQuery.mockReturnValue({ data: { items: [post('fp_1', 2)] }, isPending: false, isError: false });

    render();

    expect(counts()).toEqual({ fp_1: 7 });
  });

  it('writes nothing before the posts arrive', () => {
    render();

    expect(counts()).toBeUndefined();
    expect(readCountFloors()).toEqual({});
  });
});
