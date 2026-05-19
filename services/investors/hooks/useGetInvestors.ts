'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { fetchInvestors } from '../investors.service';
import { InvestorsQueryKeys } from '../constants';
import type { InvestorListParams } from '../types';

/**
 * Single hook used by All / Co-investors tabs. Fetches pages on demand;
 * callers trigger the next page via `fetchNextPage`.
 * `page` is excluded from the query key so filter changes reset to page 1
 * without polluting the key with transient pagination state.
 */
export function useGetInvestors(params: InvestorListParams, enabled: boolean) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { page: _page, ...filterParams } = params;

  return useInfiniteQuery({
    queryKey: [InvestorsQueryKeys.INVESTORS_LIST, filterParams],
    queryFn: ({ pageParam }) => fetchInvestors({ ...params, page: pageParam as number }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { page, limit, total } = lastPage;
      return page * limit < total ? page + 1 : undefined;
    },
    enabled,
    staleTime: 60 * 1000,
  });
}
