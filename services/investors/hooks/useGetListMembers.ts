'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { fetchListMembers } from '../lists.service';
import { InvestorsQueryKeys } from '../constants';
import type { ListMembersParams } from '../types';

/**
 * Paginated members of one target list, with in-list refinements (q / sector /
 * stage / check / relationship). Drives the warm-intros ranked table. Enabled
 * only once a list is selected.
 */
export function useGetListMembers(listId: string, params: ListMembersParams, enabled: boolean) {
  return useQuery({
    queryKey: [InvestorsQueryKeys.LIST_MEMBERS, listId, params],
    queryFn: () => fetchListMembers(listId, params),
    enabled: enabled && !!listId,
    staleTime: 30_000,
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: false,
  });
}
