'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchInvestorById } from '../investors.service';
import { InvestorsQueryKeys } from '../constants';

export function useGetInvestorById(id: string | null) {
  return useQuery({
    queryKey: [InvestorsQueryKeys.INVESTOR_DETAIL, id],
    queryFn: () => fetchInvestorById(id as string),
    enabled: !!id,
    staleTime: 60 * 1000,
  });
}
