import { useQuery } from '@tanstack/react-query';
import { fetchFounderFilters } from '../founders.service';
import { FoundersQueryKeys } from '../constants';

export function useGetFounderFilters(enabled = true) {
  return useQuery({
    queryKey: [FoundersQueryKeys.FOUNDERS_FILTERS],
    queryFn: () => fetchFounderFilters(),
    enabled,
    staleTime: 5 * 60_000,
  });
}
