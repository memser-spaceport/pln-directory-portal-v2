import { useQuery } from '@tanstack/react-query';
import { IDealsSearchParams } from '@/types/deals.types';
import { getDeals } from '../deals.service';
import { DealsQueryKeys } from '../constants';

export function useGetDeals(params: IDealsSearchParams) {
  return useQuery({
    queryKey: [DealsQueryKeys.DEALS_LIST, params],
    queryFn: () => getDeals(params),
    staleTime: 30000,
    gcTime: 60000,
  });
}
