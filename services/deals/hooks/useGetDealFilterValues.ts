import { useQuery } from '@tanstack/react-query';
import { getDealFilterValues } from '../deals.service';
import { DealsQueryKeys } from '../constants';

export function useGetDealFilterValues() {
  return useQuery({
    queryKey: [DealsQueryKeys.DEAL_FILTER_VALUES],
    queryFn: () => getDealFilterValues(),
    staleTime: 60000,
    gcTime: 120000,
  });
}
