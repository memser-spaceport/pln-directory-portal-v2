import { IUserInfo } from '@/types/shared.types';

import { isAdminUser } from '@/utils/user/isAdminUser';

export function isTeamLeaderOrAdmin(userInfo?: IUserInfo | null, teamId: string = '') {
  try {
    return !!(isAdminUser(userInfo) || userInfo?.leadingTeams?.includes(teamId));
  } catch (e) {
    return false;
  }
}
