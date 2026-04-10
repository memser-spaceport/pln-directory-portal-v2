import { useQuery } from '@tanstack/react-query';
import { RbacQueryKeys } from '../constants';
import { fetchRbacMe } from '../rbac.service';
import { getUserInfoFromLocal } from '@/utils/common.utils';

export function useFounderGuidesScopes(): { scopes: string[]; isLoading: boolean } {
  const userInfo = getUserInfoFromLocal();

  const { data: scopes = [], isLoading } = useQuery({
    queryKey: [RbacQueryKeys.RBAC_ME, 'founder-guides-scopes'],
    queryFn: async () => {
      const rbac = await fetchRbacMe();
      const perm = rbac.permissions.find((p) => p.name === 'founder_guides.view');
      return perm?.scopes ?? [];
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!userInfo,
    retry: 2,
  });

  return { scopes, isLoading };
}
