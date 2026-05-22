'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchCoInvestorTeams } from '../investors.service';
import { InvestorsQueryKeys } from '../constants';

export function useGetCoInvestorTeams(enabled: boolean) {
  return useQuery({
    queryKey: [InvestorsQueryKeys.CO_INVESTOR_TEAMS],
    queryFn: fetchCoInvestorTeams,
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}
