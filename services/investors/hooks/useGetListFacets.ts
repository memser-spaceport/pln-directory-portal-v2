'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchListFacets } from '../lists.service';
import { InvestorsQueryKeys } from '../constants';
import type { ListFacetsResponse } from '../types';

export function useGetListFacets(listId: string, enabled: boolean) {
  return useQuery<ListFacetsResponse>({
    queryKey: [InvestorsQueryKeys.LIST_FACETS, listId],
    queryFn: () => fetchListFacets(listId),
    enabled: enabled && !!listId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
