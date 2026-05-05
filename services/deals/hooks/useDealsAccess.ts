import { useQuery } from '@tanstack/react-query';
import { DealsQueryKeys } from '../constants';
import { fetchMyAccess } from '@/services/access-control/access-control.service';
import { useCurrentUserStore } from '@/services/auth/store';

export function useDealsAccess() {
  const { currentUser } = useCurrentUserStore();

  const {
    data: hasAccess = false,
    isLoading,
    isError,
  } = useQuery({
    queryKey: [DealsQueryKeys.DEALS_ACCESS],
    queryFn: async () => {
      const access = await fetchMyAccess();
      return access?.effectivePermissions.includes('deals.read');
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!currentUser,
    retry: 2,
  });

  return { hasAccess, isLoading, isError };
}
