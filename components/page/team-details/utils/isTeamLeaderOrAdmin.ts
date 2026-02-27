import { ADMIN_ROLE } from '@/utils/constants';

import { IUserInfo } from '@/types/shared.types';

export function isTeamLeaderOrAdmin(userInfo?: IUserInfo, teamId: string = '') {
  try {
    return !!(userInfo?.roles?.includes(ADMIN_ROLE) || userInfo?.leadingTeams?.includes(teamId));
  } catch (e) {
    return false;
  }
}
