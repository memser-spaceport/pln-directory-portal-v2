'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchMyAccess } from '@/services/access-control/access-control.service';
import { getUserInfoFromLocal } from '@/utils/common.utils';

export type InvestorsAccess = {
  /** Has read access to the investor DB. Required to see the page at all. */
  canView: boolean;
  /** Has write access (tag, save view, CSV export, etc.). */
  canEdit: boolean;
  isLoading: boolean;
  isError: boolean;
};

const PERM_VIEW = 'investor_db.view';
const PERM_EDIT = 'investor_db.edit';

/**
 * RBAC gate for the Investor DB module. Permissions are flat (`view` / `edit`)
 * because the 3 tabs (All / In Network / Co-investors) are just lenses over
 * the same dataset — splitting permissions per tab wouldn't map to anything
 * meaningful in the backend.
 *
 * Uses the V2 access-control service (`/v2/access-control-v2/me/access`) which
 * reads from PolicyAssignment + direct member permissions — the legacy
 * `/v1/rbac/me` only reads V1 RoleAssignment and is deprecated.
 *
 * Backend setup: `investor_db.view` / `investor_db.edit` registered via
 * `apps/web-api/prisma/migrations/20260514213000_add_rbac_for_investor_db/`.
 * Granted by default to `directory_admin_pl_internal` and the new
 * `pl_investment_team_pl_internal` policies.
 */
export function useInvestorsAccess(): InvestorsAccess {
  const userInfo = getUserInfoFromLocal();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['access-control-me', 'investors'],
    queryFn: async () => {
      const access = await fetchMyAccess();
      const set = new Set(access.effectivePermissions ?? []);
      return {
        canView: set.has(PERM_VIEW),
        canEdit: set.has(PERM_EDIT),
      };
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!userInfo,
    retry: 2,
  });

  return {
    canView: data?.canView ?? false,
    canEdit: data?.canEdit ?? false,
    isLoading,
    isError,
  };
}
