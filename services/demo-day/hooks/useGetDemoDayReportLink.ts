import { useQuery } from '@tanstack/react-query';
import { DemoDayQueryKeys } from '../constants';
import { fetchDemoDayReportLink } from '../demo-day-admin.service';
import { useCurrentUserStore } from '@/services/auth/store';

export function useGetDemoDayReportLink() {
  const { currentUser } = useCurrentUserStore();

  return useQuery({
    queryKey: [DemoDayQueryKeys.GET_DEMO_DAY_REPORT_LINK],
    queryFn: fetchDemoDayReportLink,
    staleTime: 5 * 60 * 1000,
    enabled: !!currentUser,
    retry: 2,
  });
}
