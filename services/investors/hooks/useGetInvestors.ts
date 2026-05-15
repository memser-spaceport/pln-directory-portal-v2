'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchInvestors } from '../investors.service';
import { InvestorsQueryKeys } from '../constants';
import type { InvestorListParams } from '../types';

/**
 * Single hook used by All / In Network / Co-investors tabs. The caller
 * passes the right filter flags (in_lab_os, is_co_investor) for each tab.
 */
export function useGetInvestors(params: InvestorListParams, enabled: boolean) {
  return useQuery({
    queryKey: [InvestorsQueryKeys.INVESTORS_LIST, params],
    queryFn: () => fetchInvestors(params),
    enabled,
    staleTime: 60 * 1000,
  });
}
