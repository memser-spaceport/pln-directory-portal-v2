import type { ITeam } from '@/types/teams.types';
import type { IUserInfo } from '@/types/shared.types';
import { isAdminUser } from '@/utils/user/isAdminUser';

export function canPostTeamNews(
  team: ITeam,
  userInfo: IUserInfo | null | undefined,
  isCurrentUserTeamMember: boolean,
): boolean {
  if (!userInfo?.uid) return false;
  if (team.status === 'INACTIVE') return false;
  return isAdminUser(userInfo) || isCurrentUserTeamMember;
}
