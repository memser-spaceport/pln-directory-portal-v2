'use client';

import { useQuery } from '@tanstack/react-query';

import { fetchMyAccess, type MyAccessResponse } from '@/services/access-control/access-control.service';
import { AccessControlQueryKeys } from '@/services/access-control/constants';
import { useCurrentUserStore } from '@/services/auth/store';

/** RBAC policy held by Infra team members. */
export const PL_INFRA_TEAM_POLICY = 'pl_infra_team_pl_internal';

export function hasInfraPolicy(policyCodes: string[]): boolean {
  return policyCodes.includes(PL_INFRA_TEAM_POLICY);
}

/**
 * Reads policies from /me/access, not the login cookie: the cookie's userInfo omits
 * `rbac.policies`. Shares the query key with usePermissions, so no extra request.
 */
export function useIsInfraMember(): boolean {
  const { currentUser } = useCurrentUserStore();

  const { data, isError } = useQuery<MyAccessResponse>({
    queryKey: [AccessControlQueryKeys.MY_ACCESS],
    queryFn: fetchMyAccess,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    enabled: !!currentUser,
    retry: 2,
  });

  if (!data || isError) return false;
  return hasInfraPolicy(data.policies.map((policy) => policy.code));
}
