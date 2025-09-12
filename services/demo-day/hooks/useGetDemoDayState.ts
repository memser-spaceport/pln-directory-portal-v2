import { useQuery } from '@tanstack/react-query';
import { DemoDayQueryKeys } from '@/services/demo-day/constants';

async function fetcher() {
  return {};
}

export function useMember() {
  return useQuery({
    queryKey: [DemoDayQueryKeys.GET_DEMO_DAY_STATE],
    queryFn: fetcher,
  });
}
