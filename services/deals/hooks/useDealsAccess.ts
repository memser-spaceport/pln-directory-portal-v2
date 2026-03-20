import { useQuery } from '@tanstack/react-query';
import { DealsQueryKeys } from '../constants';
import { checkDealsAccess } from '../deals.service';
import { getUserInfoFromLocal } from '@/utils/common.utils';

export function useDealsAccess() {
  const userInfo = getUserInfoFromLocal();

  const {
    data: hasAccess = false,
    isLoading,
    isError,
  } = useQuery({
    queryKey: [DealsQueryKeys.DEALS_ACCESS],
    queryFn: checkDealsAccess,
    staleTime: 5 * 60 * 1000,
    enabled: !!userInfo,
    retry: 2,
  });

  return { hasAccess, isLoading, isError };
}
