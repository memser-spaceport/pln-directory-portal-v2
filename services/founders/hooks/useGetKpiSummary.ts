import { useQuery } from '@tanstack/react-query';
import { fetchFoundersKpiSummary } from '../founders.service';
import { FoundersQueryKeys } from '../constants';

export function useGetKpiSummary(weeks = 4, enabled = true) {
  return useQuery({
    queryKey: [FoundersQueryKeys.FOUNDERS_KPI_SUMMARY, weeks],
    queryFn: () => fetchFoundersKpiSummary(weeks),
    enabled,
    staleTime: 5 * 60_000,
  });
}
