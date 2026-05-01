import { useQuery } from '@tanstack/react-query';
import { AccessControlQueryKeys } from '@/services/access-control/constants';
import { fetchMyAccess } from '@/services/access-control/access-control.service';
import { getUserInfoFromLocal } from '@/utils/common.utils';
import { AVAILABLE_SCOPES } from '@/services/articles/constants';

export function useFounderGuidesScopes(): { scopes: string[]; isLoading: boolean } {
  const userInfo = getUserInfoFromLocal();

  const { data: scopes = [], isLoading } = useQuery({
    queryKey: [AccessControlQueryKeys.MY_ACCESS],
    queryFn: fetchMyAccess,
    select: (data) => {
      const viewPerms = data.effectivePermissions.filter((p) => p.startsWith('founder_guides.view.'));
      if (viewPerms.includes('founder_guides.view.all')) {
        return [...AVAILABLE_SCOPES];
      }
      return viewPerms.map((p) => p.replace('founder_guides.view.', '').toUpperCase());
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!userInfo,
    retry: 2,
  });

  return { scopes, isLoading };
}
