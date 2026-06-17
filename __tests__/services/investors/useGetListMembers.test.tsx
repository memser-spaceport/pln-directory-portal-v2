import { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';

jest.unmock('@tanstack/react-query');

import { getListMembersNextPageParam, useGetListMembers } from '@/services/investors/hooks/useGetListMembers';
import { fetchListMembers } from '@/services/investors/lists.service';
import type { OutreachInvestor } from '@/services/investors/types';

jest.mock('@/services/investors/lists.service', () => ({
  fetchListMembers: jest.fn(),
}));

const mockFetchListMembers = fetchListMembers as jest.MockedFunction<typeof fetchListMembers>;

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe('getListMembersNextPageParam', () => {
  it('returns the next page when more rows exist', () => {
    expect(getListMembersNextPageParam({ page: 1, limit: 200, total: 450, items: [] })).toBe(2);
  });

  it('returns undefined on the final page', () => {
    expect(getListMembersNextPageParam({ page: 3, limit: 200, total: 450, items: [] })).toBeUndefined();
  });
});

describe('useGetListMembers', () => {
  beforeEach(() => {
    mockFetchListMembers.mockReset();
  });

  it('fetches the first page and exposes hasNextPage when more rows exist', async () => {
    mockFetchListMembers.mockResolvedValueOnce({
      page: 1,
      limit: 200,
      total: 450,
      items: [{ investor_id: 'inv-1' } as OutreachInvestor],
    });

    const { result } = renderHook(() => useGetListMembers('list-1', { limit: 200 }, true), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockFetchListMembers).toHaveBeenCalledWith('list-1', { limit: 200, page: 1 });
    expect(result.current.data?.pages).toHaveLength(1);
    expect(result.current.hasNextPage).toBe(true);
  });

  it('stops pagination when the last page is reached', async () => {
    mockFetchListMembers.mockResolvedValueOnce({
      page: 1,
      limit: 200,
      total: 150,
      items: [{ investor_id: 'inv-1' } as OutreachInvestor],
    });

    const { result } = renderHook(() => useGetListMembers('list-1', { limit: 200 }, true), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.hasNextPage).toBe(false);
  });
});
