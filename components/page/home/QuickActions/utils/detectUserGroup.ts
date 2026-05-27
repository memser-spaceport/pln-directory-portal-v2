import type { IUserInfo } from '@/types/shared.types';

type UserGroup = 'pl-infra' | 'founder' | 'others';

export function detectUserGroup(policies: NonNullable<IUserInfo['rbac']>['policies'] | undefined): UserGroup {
  if (!policies?.length) {
    return 'others';
  }

  if (policies.some((p) => p.code === 'pl_infra_team_pl_internal')) {
    return 'pl-infra';
  }

  if (policies.some((p) => p.code.startsWith('founder_plc_'))) {
    return 'founder';
  }

  return 'others';
}
