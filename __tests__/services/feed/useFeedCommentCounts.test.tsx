import { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';

// jest.setup.js stubs useQuery globally; this is all about what actually lands
// in the shared counts cache entry, so it needs the real client.
jest.unmock('@tanstack/react-query');

import { useFeedCommentCounts } from '@/services/feed/hooks/useFeedCommentCounts';
import { feedQueryKeys } from '@/services/feed/constants';
import type { IFeedCommentCountsResponse } from '@/types/feed.types';

const mockGetFeedCommentCounts = jest.fn();

jest.mock('@/services/feed/feed.service', () => ({
  getFeedCommentCounts: (...args: unknown[]) => mockGetFeedCommentCounts(...args),
}));

jest.mock('@/utils/third-party.helper', () => ({
  getCookiesFromClient: () => ({ authToken: 'token-1' }),
}));

describe('useFeedCommentCounts', () => {
  let client: QueryClient;

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );

  const counts = () => client.getQueryData<IFeedCommentCountsResponse>(feedQueryKeys.commentCounts());
  const requestedUids = () => mockGetFeedCommentCounts.mock.calls.map(([uids]) => uids);

  beforeEach(() => {
    jest.clearAllMocks();
    client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    mockGetFeedCommentCounts.mockResolvedValue({});
  });

  it('fetches the given uids and merges the answer into the shared entry', async () => {
    mockGetFeedCommentCounts.mockResolvedValue({ 'news-1': 3 });

    renderHook(() => useFeedCommentCounts({ uids: ['news-1', 'news-2'], enabled: true }), { wrapper });

    await waitFor(() => expect(counts()).toEqual({ 'news-1': 3 }));
    expect(mockGetFeedCommentCounts).toHaveBeenCalledWith(['news-1', 'news-2'], 'token-1');
    // news-2 came back absent, not zero: the endpoint omits zero-count uids and
    // the button renders "unknown" as no number rather than a fake 0.
    expect(counts()?.['news-2']).toBeUndefined();
  });

  it('asks only for uids nobody has asked for yet, and keeps the earlier answers', async () => {
    mockGetFeedCommentCounts.mockResolvedValueOnce({ 'news-1': 3 }).mockResolvedValueOnce({ 'news-9': 1 });

    // A team profile's rail asks for its three stories…
    const rail = renderHook(() => useFeedCommentCounts({ uids: ['news-1', 'news-2'], enabled: true }), { wrapper });
    await waitFor(() => expect(counts()).toEqual({ 'news-1': 3 }));
    rail.unmount();

    // …then /home mounts with an overlapping, much larger set. THIS is the
    // regression the incremental fetcher exists for: a fetch-once query would
    // already be filled and would leave every other story without a count.
    renderHook(() => useFeedCommentCounts({ uids: ['news-1', 'news-2', 'news-9'], enabled: true }), { wrapper });

    await waitFor(() => expect(counts()).toEqual({ 'news-1': 3, 'news-9': 1 }));
    expect(requestedUids()).toEqual([['news-1', 'news-2'], ['news-9']]);
  });

  it('does not re-request when the same uids arrive in a new array', async () => {
    const { rerender } = renderHook(({ uids }) => useFeedCommentCounts({ uids, enabled: true }), {
      wrapper,
      initialProps: { uids: ['news-1'] },
    });
    await waitFor(() => expect(mockGetFeedCommentCounts).toHaveBeenCalledTimes(1));

    rerender({ uids: ['news-1'] });
    rerender({ uids: [...['news-1']] });

    expect(mockGetFeedCommentCounts).toHaveBeenCalledTimes(1);
  });

  it('claims uids before awaiting, so two surfaces mounting together ask once', async () => {
    renderHook(() => useFeedCommentCounts({ uids: ['news-1'], enabled: true }), { wrapper });
    renderHook(() => useFeedCommentCounts({ uids: ['news-1'], enabled: true }), { wrapper });

    await waitFor(() => expect(mockGetFeedCommentCounts).toHaveBeenCalledTimes(1));
  });

  it('releases the claim when the request fails, so a later mount retries', async () => {
    mockGetFeedCommentCounts.mockRejectedValueOnce(new Error('offline'));

    const first = renderHook(() => useFeedCommentCounts({ uids: ['news-1'], enabled: true }), { wrapper });
    await waitFor(() => expect(mockGetFeedCommentCounts).toHaveBeenCalledTimes(1));
    first.unmount();

    mockGetFeedCommentCounts.mockResolvedValueOnce({ 'news-1': 2 });
    renderHook(() => useFeedCommentCounts({ uids: ['news-1'], enabled: true }), { wrapper });

    await waitFor(() => expect(counts()).toEqual({ 'news-1': 2 }));
  });

  it('re-asks after the entry is dropped, so counts come back rather than staying blank', async () => {
    mockGetFeedCommentCounts.mockResolvedValue({ 'news-1': 3 });
    const first = renderHook(() => useFeedCommentCounts({ uids: ['news-1'], enabled: true }), { wrapper });
    await waitFor(() => expect(counts()).toEqual({ 'news-1': 3 }));
    first.unmount();

    // What garbage collection does once no observer is left.
    client.removeQueries({ queryKey: feedQueryKeys.commentCounts() });

    renderHook(() => useFeedCommentCounts({ uids: ['news-1'], enabled: true }), { wrapper });
    await waitFor(() => expect(counts()).toEqual({ 'news-1': 3 }));
    expect(mockGetFeedCommentCounts).toHaveBeenCalledTimes(2);
  });

  it('never overwrites a value already in the entry', async () => {
    // A comment posted while the request was in flight: the mutation's patch is
    // fresher than the answer to a question asked before it.
    let resolveCounts: (value: IFeedCommentCountsResponse) => void = () => {};
    mockGetFeedCommentCounts.mockReturnValue(
      new Promise<IFeedCommentCountsResponse>((resolve) => {
        resolveCounts = resolve;
      }),
    );

    renderHook(() => useFeedCommentCounts({ uids: ['news-1'], enabled: true }), { wrapper });
    await waitFor(() => expect(mockGetFeedCommentCounts).toHaveBeenCalledTimes(1));

    client.setQueryData<IFeedCommentCountsResponse>(feedQueryKeys.commentCounts(), { 'news-1': 4 });
    resolveCounts({ 'news-1': 3 });

    await waitFor(() => expect(counts()).toEqual({ 'news-1': 4 }));
  });

  it('asks for nothing while disabled', () => {
    renderHook(() => useFeedCommentCounts({ uids: ['news-1'], enabled: false }), { wrapper });
    expect(mockGetFeedCommentCounts).not.toHaveBeenCalled();
  });
});
