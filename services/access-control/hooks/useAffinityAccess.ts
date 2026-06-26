import { useQuery } from '@tanstack/react-query';
import { AccessControlQueryKeys } from '@/services/access-control/constants';
import { fetchMyAccess } from '@/services/access-control/access-control.service';
import { useCurrentUserStore } from '@/services/auth/store';

export function useAffinityAccess() {
  const { currentUser } = useCurrentUserStore();

  const { data: hasAccess = false, isLoading, isError } = useQuery({
    queryKey: [AccessControlQueryKeys.MY_ACCESS],
    queryFn: fetchMyAccess,
    select: (data) => data.effectivePermissions.includes('member.affinity.read'),
    staleTime: 5 * 60 * 1000,
    enabled: !!currentUser,
    retry: 2,
  });

  return { hasAccess, isLoading, isError };
}
