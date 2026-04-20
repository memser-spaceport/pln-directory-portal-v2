import { useQuery } from '@tanstack/react-query';
import { RbacQueryKeys } from '../constants';
import { fetchRbacMe } from '../rbac.service';
import { getUserInfoFromLocal } from '@/utils/common.utils';

export function useFounderGuidesCreateAccess() {
  const userInfo = getUserInfoFromLocal();

  const {
    data: canCreate = false,
    isLoading,
    isError,
  } = useQuery({
    queryKey: [RbacQueryKeys.RBAC_ME, 'founder-guides-create'],
    queryFn: async () => {
      const rbac = await fetchRbacMe();
      return rbac.permissions.some((p) => p.name === 'founder_guides.create');
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!userInfo,
    retry: 2,
  });

  return { canCreate, isLoading, isError };
}
