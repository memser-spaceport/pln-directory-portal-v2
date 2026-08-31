import type { ReactNode } from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { useInfiniteTeamsList } from '@/services/teams/hooks/useInfiniteTeamsList';
import { SORT_OPTIONS } from '@/utils/constants';
import type { TeamsListQueryParams } from '@/services/teams/types';

/**
 * The teams list sends its sort as the toolbar's own value ("Name,asc"), which the
 * API does not understand — it wants "name:asc". The transform lives inside the
 * private fetcher, so the only way to pin it is through the query string handed
 * to getTeamList.
 */

const mockGetTeamList = jest.fn(async (query: string, page: number, limit: number, authToken?: string) => ({
  data: [],
  totalItems: 0,
  followingTotal: 0,
}));

jest.mock('@/app/actions/teams.actions', () => ({
  getTeamList: (...a: Parameters<typeof mockGetTeamList>) => mockGetTeamList(...a),
}));

jest.mock('@/utils/third-party.helper', () => ({
  getCookiesFromClient: () => ({ authToken: 'token-1' }),
}));

jest.mock('@/components/core/ToastContainer', () => ({
  toast: { error: jest.fn() },
}));

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

/** Renders the hook and returns the query string the fetcher built. */
async function queryFor(searchParams: TeamsListQueryParams['searchParams']) {
  renderHook(() => useInfiniteTeamsList({ searchParams } as TeamsListQueryParams), { wrapper });

  await waitFor(() => expect(mockGetTeamList).toHaveBeenCalled());

  return new URLSearchParams(mockGetTeamList.mock.calls.at(-1)?.[0] ?? '');
}

beforeEach(() => jest.clearAllMocks());

describe('useInfiniteTeamsList — the sort the API actually accepts', () => {
  it("rewrites the toolbar's ascending option into field:direction", async () => {
    const query = await queryFor({ sort: SORT_OPTIONS.ASCENDING } as never);

    expect(query.get('sort')).toBe('name:asc');
  });

  it('rewrites the descending option the same way', async () => {
    const query = await queryFor({ sort: SORT_OPTIONS.DESCENDING } as never);

    expect(query.get('sort')).toBe('name:desc');
  });

  it('rewrites the default option rather than passing it through untouched', async () => {
    const query = await queryFor({ sort: SORT_OPTIONS.DEFAULT } as never);

    expect(query.get('sort')).toBe('name:default');
  });

  it('never sends the comma form the toolbar stores', async () => {
    const query = await queryFor({ sort: SORT_OPTIONS.ASCENDING } as never);

    expect(query.get('sort')).not.toContain(',');
    expect(query.get('sort')).not.toBe(SORT_OPTIONS.ASCENDING);
  });

  it('lowercases the field, not just the direction', async () => {
    const query = await queryFor({ sort: 'Name,ASC' } as never);

    expect(query.get('sort')).toBe('name:asc');
  });

  it('omits sort entirely when the toolbar has none set', async () => {
    const query = await queryFor({} as never);

    expect(query.get('sort')).toBeNull();
  });
});

describe('useInfiniteTeamsList — the rest of the query is untouched by the sort fix', () => {
  it('splits investmentFocus on the pipe the URL uses', async () => {
    const query = await queryFor({ investmentFocus: 'ai|web3' } as never);

    expect(query.getAll('investmentFocus[0]')).toEqual(['ai']);
    expect(query.getAll('investmentFocus[1]')).toEqual(['web3']);
  });

  it('maps the "no priority" sentinel -1 onto 99, which sorts last', async () => {
    const query = await queryFor({ priorities: '1|-1' } as never);

    expect(query.get('priorities[0]')).toBe('1');
    expect(query.get('priorities[1]')).toBe('99');
  });

  it('passes the auth token through so following counts come back', async () => {
    await queryFor({ sort: SORT_OPTIONS.ASCENDING } as never);

    expect(mockGetTeamList).toHaveBeenLastCalledWith(expect.any(String), 1, expect.any(Number), 'token-1');
  });
});
