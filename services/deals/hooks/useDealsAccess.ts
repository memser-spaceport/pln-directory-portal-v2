import { useQuery } from '@tanstack/react-query';
import { DealsQueryKeys } from '../constants';
import { checkDealsAccess } from '../deals.service';

export function useDealsAccess(enabled = true) {
  const { data: hasAccess = false, isLoading } = useQuery({
    queryKey: [DealsQueryKeys.DEALS_ACCESS],
    queryFn: checkDealsAccess,
    staleTime: 5 * 60 * 1000,
    enabled,
  });

  return { hasAccess, isLoading };
}
