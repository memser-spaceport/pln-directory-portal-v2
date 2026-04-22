import { useQuery } from '@tanstack/react-query';
import { AccessControlQueryKeys } from '@/services/access-control/constants';
import { fetchMyAccess } from '@/services/access-control/access-control.service';
import { getUserInfoFromLocal } from '@/utils/common.utils';

export type ForumAccessDeniedReason = 'base' | 'investor';

interface ForumAccessResult {
  hasAccess: boolean;
  deniedReason: ForumAccessDeniedReason | null;
}

const EMPTY: ForumAccessResult = { hasAccess: false, deniedReason: 'base' };

export function useForumAccess() {
  const userInfo = getUserInfoFromLocal();

  const {
    data = EMPTY,
    isLoading,
    isError,
  } = useQuery({
    queryKey: [AccessControlQueryKeys.MY_ACCESS],
    queryFn: fetchMyAccess,
    select: (data): ForumAccessResult => {
      const hasAccess = data.effectivePermissions.includes('forum.read');
      if (hasAccess) return { hasAccess: true, deniedReason: null };
      const hasMemberAccess = data.effectivePermissions.includes('member.contacts.read');
      return { hasAccess: false, deniedReason: hasMemberAccess ? 'investor' : 'base' };
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!userInfo,
    retry: 2,
  });

  return { hasAccess: data.hasAccess, deniedReason: data.deniedReason, isLoading, isError };
}
