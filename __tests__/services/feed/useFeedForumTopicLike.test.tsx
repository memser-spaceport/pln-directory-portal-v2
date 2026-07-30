import { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react';

// jest.setup.js stubs useQuery globally; this hook is all about reading a real
// cache entry through `select`, so it needs the real implementation.
jest.unmock('@tanstack/react-query');

import { useFeedForumTopicLike } from '@/services/feed/hooks/useFeedComments';
import { feedQueryKeys } from '@/services/feed/constants';
import { getFeedComments } from '@/services/feed/feed.service';
import type { IFeedCommentsResponse } from '@/types/feed.types';

jest.mock('@/services/feed/feed.service', () => ({ getFeedComments: jest.fn() }));
jest.mock('@/utils/third-party.helper', () => ({ getCookiesFromClient: () => ({ authToken: 'token' }) }));

const getFeedCommentsMock = getFeedComments as jest.MockedFunction<typeof getFeedComments>;

describe('useFeedForumTopicLike', () => {
  let client: QueryClient;

  beforeEach(() => {
    jest.clearAllMocks();
    client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  });

  function wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  }

  function seedThread(uid: string, forumTopic: IFeedCommentsResponse['forumTopic']) {
    client.setQueryData<IFeedCommentsResponse>(feedQueryKeys.comments(uid), { items: [], forumTopic });
  }

  it('reads the topic’s vote state out of the thread’s cache entry', () => {
    seedThread('fp_96', {
      url: '/forum/topics/5/96',
      totalReplyCount: 2,
      like: { likeCount: 7, viewerHasLiked: true },
    });

    const { result } = renderHook(() => useFeedForumTopicLike('fp_96'), { wrapper });

    expect(result.current).toEqual({ likeCount: 7, viewerHasLiked: true });
  });

  it('never fetches — the thread owns the request, this only observes it', () => {
    seedThread('fp_96', { url: null, totalReplyCount: 0, like: { likeCount: 1, viewerHasLiked: false } });

    renderHook(() => useFeedForumTopicLike('fp_96'), { wrapper });

    expect(getFeedCommentsMock).not.toHaveBeenCalled();
  });

  it('returns undefined before the thread has been opened, so nothing gets seeded', () => {
    const { result } = renderHook(() => useFeedForumTopicLike('fp_96'), { wrapper });

    expect(result.current).toBeUndefined();
    expect(getFeedCommentsMock).not.toHaveBeenCalled();
  });

  it('returns undefined for a news item, which has no forum topic', () => {
    client.setQueryData<IFeedCommentsResponse>(feedQueryKeys.comments('n-1'), { items: [] });

    const { result } = renderHook(() => useFeedForumTopicLike('n-1'), { wrapper });

    expect(result.current).toBeUndefined();
  });

  it('stays idle with no active post', () => {
    const { result } = renderHook(() => useFeedForumTopicLike(null), { wrapper });

    expect(result.current).toBeUndefined();
    expect(getFeedCommentsMock).not.toHaveBeenCalled();
  });
});
