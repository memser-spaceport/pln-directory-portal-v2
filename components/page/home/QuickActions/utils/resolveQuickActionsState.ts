import type { IUserInfo } from '@/types/shared.types';

export type UserGroup = 'pl-infra' | 'founder' | 'others';

export interface QuickActionsState {
  group: UserGroup;
  hasDealsAccess: boolean;
  hasOhAccess: boolean;
}

const OH_PERMISSION_CODES = ['oh.supply.read', 'oh.supply.write', 'oh.demand.read', 'oh.demand.write'];

/**
 * Decides which Quick Actions cards a member sees, from plain permission/policy
 * code arrays. Kept pure and shape-agnostic so the server (which resolves this
 * from the cookie + /me/access) and the client fallback can share one source of
 * truth — the card set has to be identical in both, or the band shifts on load.
 *
 * Callers normalise their own wire shapes via the helpers below: the cookie
 * carries `{ code }[]` while /v2/access-control-v2/me/access returns `string[]`.
 */
export function resolveQuickActionsState(policyCodes: string[], permissionCodes: string[]): QuickActionsState {
  const perms = new Set(permissionCodes);

  return {
    group: resolveGroup(policyCodes),
    hasDealsAccess: perms.has('deals.read'),
    hasOhAccess: OH_PERMISSION_CODES.some((code) => perms.has(code)),
  };
}

function resolveGroup(policyCodes: string[]): UserGroup {
  if (!policyCodes.length) {
    return 'others';
  }

  if (policyCodes.includes('pl_infra_team_pl_internal')) {
    return 'pl-infra';
  }

  if (policyCodes.some((code) => code.startsWith('founder_plc_'))) {
    return 'founder';
  }

  return 'others';
}

export function codesFromCookiePolicies(rbac: IUserInfo['rbac']): string[] {
  return rbac?.policies?.map((policy) => policy.code) ?? [];
}

export function codesFromCookiePermissions(rbac: IUserInfo['rbac']): string[] {
  return rbac?.effectivePermissions?.map((permission) => permission.code) ?? [];
}
