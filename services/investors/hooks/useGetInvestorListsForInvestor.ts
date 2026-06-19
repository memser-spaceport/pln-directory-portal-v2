'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchInvestorLists } from '../lists.service';
import { InvestorsQueryKeys } from '../constants';

/**
 * Target lists with per-investor membership flags (for the Add to list popover).
 * Pass investorId so the API returns is_member on each list.
 */
export function useGetInvestorListsForInvestor(investorId: string, enabled: boolean) {
  return useQuery({
    queryKey: [InvestorsQueryKeys.INVESTOR_LISTS, investorId],
    queryFn: () => fetchInvestorLists(investorId),
    enabled: enabled && !!investorId,
    staleTime: 60 * 1000,
  });
}
