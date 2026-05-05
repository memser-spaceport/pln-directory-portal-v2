import { useQuery } from '@tanstack/react-query';
import { AccessControlQueryKeys } from '@/services/access-control/constants';
import { fetchMyAccess } from '@/services/access-control/access-control.service';
import { useCurrentUserStore } from '@/services/auth/store';

export function useForumWriteAccess() {
  const { currentUser } = useCurrentUserStore();

  const {
    data: canWrite = false,
    isLoading,
    isError,
  } = useQuery({
    queryKey: [AccessControlQueryKeys.MY_ACCESS],
    queryFn: fetchMyAccess,
    select: (data) => data.effectivePermissions.includes('forum.write'),
    staleTime: 5 * 60 * 1000,
    enabled: !!currentUser,
    retry: 2,
  });

  return { canWrite, isLoading, isError };
}
