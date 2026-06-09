import { keepPreviousData, useInfiniteQuery } from '@tanstack/react-query';
import { fetchFounders } from '../founders.service';
import { FoundersQueryKeys } from '../constants';
import type { FounderListParams } from '../types';

/**
 * Fetches founders pages on demand. `page` is excluded from the query key
 * so filter changes reset to page 1 without polluting the cache key with
 * transient pagination state — same pattern as useGetInvestors.
 */
export function useGetFounders(params: FounderListParams, enabled = true) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { page: _page, ...filterParams } = params;

  return useInfiniteQuery({
    queryKey: [FoundersQueryKeys.FOUNDERS_LIST, filterParams],
    queryFn: ({ pageParam }) => fetchFounders({ ...params, page: pageParam as number }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { page, limit, total } = lastPage;
      return page * limit < total ? page + 1 : undefined;
    },
    enabled,
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  });
}
