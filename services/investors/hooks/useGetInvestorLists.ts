'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchInvestorLists } from '../lists.service';
import { InvestorsQueryKeys } from '../constants';

/**
 * All target lists the warm-intros workspace can operate over (v1: Neuro + Gold,
 * pre-created server-side). Proximity is only meaningful within a graphed list.
 */
export function useGetInvestorLists(enabled: boolean) {
  return useQuery({
    queryKey: [InvestorsQueryKeys.INVESTOR_LISTS],
    queryFn: fetchInvestorLists,
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}
