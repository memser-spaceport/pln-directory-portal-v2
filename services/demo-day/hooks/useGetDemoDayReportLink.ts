import { useQuery } from '@tanstack/react-query';
import { DemoDayQueryKeys } from '../constants';
import { fetchDemoDayReportLink } from '../demo-day-admin.service';
import { getUserInfoFromLocal } from '@/utils/common.utils';

export function useGetDemoDayReportLink() {
  const userInfo = getUserInfoFromLocal();

  return useQuery({
    queryKey: [DemoDayQueryKeys.GET_DEMO_DAY_REPORT_LINK],
    queryFn: fetchDemoDayReportLink,
    staleTime: 5 * 60 * 1000,
    enabled: !!userInfo,
    retry: 2,
  });
}
