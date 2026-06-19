import { useQuery } from '@tanstack/react-query';
import { FoundersQueryKeys } from '../constants';
import { fetchFounderMethodology } from '../founders.service';

export function useGetFounderMethodology(enabled = true) {
  return useQuery({
    queryKey: [FoundersQueryKeys.FOUNDERS_METHODOLOGY],
    queryFn: () => fetchFounderMethodology(),
    enabled,
    staleTime: 5 * 60_000,
  });
}
