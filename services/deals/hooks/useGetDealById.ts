import { useQuery } from '@tanstack/react-query';
import { getDealById } from '../deals.service';
import { DealsQueryKeys } from '../constants';

export function useGetDealById(id: string) {
  return useQuery({
    queryKey: [DealsQueryKeys.DEAL_BY_ID, id],
    queryFn: () => getDealById(id),
    enabled: !!id,
    staleTime: 30000,
    gcTime: 60000,
  });
}
