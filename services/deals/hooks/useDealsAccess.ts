import { useQuery } from '@tanstack/react-query';
import { DealsQueryKeys } from '../constants';
import { checkDealsAccess } from '@/services/deals/deals.service';
import { fetchMyAccess } from '@/services/access-control/access-control.service';
import { useCurrentUserStore } from '@/services/auth/store';

async function hasDealsAccessViaApiOrPermission(): Promise<boolean> {
  const [whitelistOrDealsEndpoint, access] = await Promise.all([checkDealsAccess(), fetchMyAccess()]);
  return whitelistOrDealsEndpoint || access.effectivePermissions.includes('deals.read');
}

export function useDealsAccess() {
  const { currentUser } = useCurrentUserStore();

  const {
    data: hasAccess = false,
    isLoading,
    isError,
  } = useQuery({
    queryKey: [DealsQueryKeys.DEALS_ACCESS],
    queryFn: hasDealsAccessViaApiOrPermission,
    staleTime: 5 * 60 * 1000,
    enabled: !!currentUser,
    retry: 2,
  });

  return { hasAccess, isLoading, isError };
}
