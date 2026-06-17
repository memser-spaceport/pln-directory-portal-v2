'use client';

import { keepPreviousData, useInfiniteQuery } from '@tanstack/react-query';
import { fetchListMembers } from '../lists.service';
import { InvestorsQueryKeys } from '../constants';
import type { ListMembersParams, OutreachInvestor } from '../types';

type ListMembersPage = {
  page: number;
  limit: number;
  total: number;
  items: OutreachInvestor[];
};

export function getListMembersNextPageParam(lastPage: ListMembersPage): number | undefined {
  const { page, limit, total } = lastPage;
  return page * limit < total ? page + 1 : undefined;
}

/**
 * Paginated members of one target list, with in-list refinements (q / sector /
 * stage / check / relationship). Fetches pages on demand via `fetchNextPage`.
 * `page` is excluded from the query key so filter changes reset to page 1.
 */
export function useGetListMembers(listId: string, params: ListMembersParams, enabled: boolean) {
  const { page: _page, ...filterParams } = params;

  return useInfiniteQuery({
    queryKey: [InvestorsQueryKeys.LIST_MEMBERS, listId, filterParams],
    queryFn: ({ pageParam }) => fetchListMembers(listId, { ...params, page: pageParam as number }),
    initialPageParam: 1,
    getNextPageParam: getListMembersNextPageParam,
    enabled: enabled && !!listId,
    staleTime: 30_000,
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: false,
  });
}
