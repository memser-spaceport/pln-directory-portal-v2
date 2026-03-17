import { useQuery } from '@tanstack/react-query';
import { getDealById } from '../deals.service';
import { DealsQueryKeys } from '../constants';

export function useGetDealById(uid: string) {
  return useQuery({
    queryKey: [DealsQueryKeys.DEAL_BY_ID, uid],
    queryFn: () => getDealById(uid),
    enabled: !!uid,
    staleTime: 30000,
    gcTime: 60000,
  });
}
