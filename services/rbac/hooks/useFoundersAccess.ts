'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchMyAccess } from '@/services/access-control/access-control.service';
import { FOUNDER_DB_ENABLED } from '@/services/founders/constants';
import { getUserInfoFromLocal } from '@/utils/common.utils';

export type FoundersAccess = {
  /** Has read access to the Founder DB. Required to see the page at all. */
  canView: boolean;
  /** Has write access — can submit review decisions. canEdit implies canView. */
  canEdit: boolean;
  isLoading: boolean;
  isError: boolean;
};

const PERM_VIEW = 'founder_db.view';
const PERM_EDIT = 'founder_db.edit';

export function useFoundersAccess(): FoundersAccess {
  const userInfo = getUserInfoFromLocal();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['access-control-me', 'founders'],
    queryFn: async () => {
      const access = await fetchMyAccess();
      const set = new Set(access.effectivePermissions ?? []);
      const canEdit = set.has(PERM_EDIT);
      return {
        canView: canEdit || set.has(PERM_VIEW),
        canEdit,
      };
    },
    staleTime: 5 * 60 * 1000,
    enabled: FOUNDER_DB_ENABLED && !!userInfo,
    retry: 2,
  });

  if (!FOUNDER_DB_ENABLED) {
    return { canView: false, canEdit: false, isLoading: false, isError: false };
  }

  return {
    canView: data?.canView ?? false,
    canEdit: data?.canEdit ?? false,
    isLoading,
    isError,
  };
}
