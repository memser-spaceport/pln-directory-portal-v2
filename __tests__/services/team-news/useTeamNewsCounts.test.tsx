import { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';

// jest.setup.js stubs useQuery globally; this is all about what actually lands
// in the shared counts cache entry, so it needs the real client.
jest.unmock('@tanstack/react-query');

import { useTeamNewsCounts, useTeamNewsCount } from '@/services/team-news/hooks/useTeamNewsCounts';
import { teamNewsCountsQueryKey } from '@/services/team-news/constants';
import type { ITeamNewsCountsResponse } from '@/types/team-news.types';

const mockGetTeamNewsCounts = jest.fn();

jest.mock('@/services/team-news/team-news.service', () => ({
  getTeamNewsCounts: (...args: unknown[]) => mockGetTeamNewsCounts(...args),
}));

describe('useTeamNewsCounts', () => {
  let client: QueryClient;

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );

  const counts = () => client.getQueryData<ITeamNewsCountsResponse>(teamNewsCountsQueryKey());
  const requestedUids = () => mockGetTeamNewsCounts.mock.calls.map(([uids]) => uids);

  beforeEach(() => {
    jest.clearAllMocks();
    client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    mockGetTeamNewsCounts.mockResolvedValue({});
  });

  it('fetches the given team uids and merges the answer into the shared entry', async () => {
    mockGetTeamNewsCounts.mockResolvedValue({ 'team-1': 3 });

    renderHook(() => useTeamNewsCounts({ uids: ['team-1', 'team-2'], enabled: true }), { wrapper });

    await waitFor(() => expect(counts()).toEqual({ 'team-1': 3 }));
    expect(mockGetTeamNewsCounts).toHaveBeenCalledWith(['team-1', 'team-2']);
    // team-2 came back absent, not zero: the endpoint omits teams with nothing
    // recent, and both states render as no chip.
    expect(counts()?.['team-2']).toBeUndefined();
  });

  it('sends no auth token — the count is the same for every viewer', async () => {
    renderHook(() => useTeamNewsCounts({ uids: ['team-1'], enabled: true }), { wrapper });

    await waitFor(() => expect(mockGetTeamNewsCounts).toHaveBeenCalledTimes(1));
    expect(mockGetTeamNewsCounts).toHaveBeenCalledWith(['team-1']);
    expect(mockGetTeamNewsCounts.mock.calls[0]).toHaveLength(1);
  });

  it('asks only for teams nobody has asked for yet, and keeps the earlier answers', async () => {
    mockGetTeamNewsCounts.mockResolvedValueOnce({ 'team-1': 3 }).mockResolvedValueOnce({ 'team-9': 1 });

    // Page one of the teams grid…
    const firstPage = renderHook(() => useTeamNewsCounts({ uids: ['team-1', 'team-2'], enabled: true }), { wrapper });
    await waitFor(() => expect(counts()).toEqual({ 'team-1': 3 }));

    // …then the reader scrolls and page two arrives, appended to the same list.
    // THIS is what the incremental fetcher exists for: re-requesting the whole
    // visible set on every page would grow quadratically down a long scroll.
    firstPage.rerender();
    renderHook(() => useTeamNewsCounts({ uids: ['team-1', 'team-2', 'team-9'], enabled: true }), { wrapper });

    await waitFor(() => expect(counts()).toEqual({ 'team-1': 3, 'team-9': 1 }));
    expect(requestedUids()).toEqual([['team-1', 'team-2'], ['team-9']]);
  });

  it('does not re-request when the same uids arrive in a new array', async () => {
    const { rerender } = renderHook(({ uids }) => useTeamNewsCounts({ uids, enabled: true }), {
      wrapper,
      initialProps: { uids: ['team-1'] },
    });
    await waitFor(() => expect(mockGetTeamNewsCounts).toHaveBeenCalledTimes(1));

    rerender({ uids: ['team-1'] });
    rerender({ uids: [...['team-1']] });

    expect(mockGetTeamNewsCounts).toHaveBeenCalledTimes(1);
  });

  it('claims uids before awaiting, so the grid and the job board ask once between them', async () => {
    renderHook(() => useTeamNewsCounts({ uids: ['team-1'], enabled: true }), { wrapper });
    renderHook(() => useTeamNewsCounts({ uids: ['team-1'], enabled: true }), { wrapper });

    await waitFor(() => expect(mockGetTeamNewsCounts).toHaveBeenCalledTimes(1));
  });

  it('releases the claim when the request fails, so a later mount retries', async () => {
    mockGetTeamNewsCounts.mockRejectedValueOnce(new Error('offline'));

    const first = renderHook(() => useTeamNewsCounts({ uids: ['team-1'], enabled: true }), { wrapper });
    await waitFor(() => expect(mockGetTeamNewsCounts).toHaveBeenCalledTimes(1));
    first.unmount();

    mockGetTeamNewsCounts.mockResolvedValueOnce({ 'team-1': 2 });
    renderHook(() => useTeamNewsCounts({ uids: ['team-1'], enabled: true }), { wrapper });

    await waitFor(() => expect(counts()).toEqual({ 'team-1': 2 }));
  });

  it('re-asks after the entry is dropped, so chips come back rather than staying blank', async () => {
    mockGetTeamNewsCounts.mockResolvedValue({ 'team-1': 3 });
    const first = renderHook(() => useTeamNewsCounts({ uids: ['team-1'], enabled: true }), { wrapper });
    await waitFor(() => expect(counts()).toEqual({ 'team-1': 3 }));
    first.unmount();

    // What garbage collection does once no observer is left — navigating off
    // /teams and back is exactly this.
    client.removeQueries({ queryKey: teamNewsCountsQueryKey() });

    renderHook(() => useTeamNewsCounts({ uids: ['team-1'], enabled: true }), { wrapper });
    await waitFor(() => expect(counts()).toEqual({ 'team-1': 3 }));
    expect(mockGetTeamNewsCounts).toHaveBeenCalledTimes(2);
  });

  it('asks for nothing while the flag is off', () => {
    renderHook(() => useTeamNewsCounts({ uids: ['team-1'], enabled: false }), { wrapper });
    expect(mockGetTeamNewsCounts).not.toHaveBeenCalled();
  });

  it('asks for nothing when the list is empty', () => {
    renderHook(() => useTeamNewsCounts({ uids: [], enabled: true }), { wrapper });
    expect(mockGetTeamNewsCounts).not.toHaveBeenCalled();
  });
});

describe('useTeamNewsCount', () => {
  let client: QueryClient;

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );

  beforeEach(() => {
    client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  });

  it('returns undefined for a team the entry has never heard of', () => {
    const { result } = renderHook(() => useTeamNewsCount('team-1'), { wrapper });
    expect(result.current).toBeUndefined();
  });

  it('narrows to one team, so a count landing elsewhere is not this chip’s business', async () => {
    client.setQueryData<ITeamNewsCountsResponse>(teamNewsCountsQueryKey(), { 'team-1': 4, 'team-2': 9 });

    const { result } = renderHook(() => useTeamNewsCount('team-1'), { wrapper });
    await waitFor(() => expect(result.current).toBe(4));
  });
});
