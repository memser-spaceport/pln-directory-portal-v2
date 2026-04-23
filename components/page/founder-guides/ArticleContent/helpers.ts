import { IArticle } from '@/types/articles.types';
import { IUserInfo } from '@/types/shared.types';
import { isAdminUser } from '@/utils/user/isAdminUser';

/** e.g. `Lawyer @PL Legal Team` from embedded `authorMember.teamMemberRoles` (main team). */
export function formatAuthorMemberMainTeamLabel(authorMember: IArticle['authorMember']): string | null {
  const roles = authorMember?.teamMemberRoles;
  if (!roles?.length) return null;
  const main = roles.find((t) => t.mainTeam) || roles[0];
  if (!main?.team?.name?.trim()) return null;
  const teamName = main.team.name.trim();
  const role = main.role?.trim();
  if (role) return `${role} @${teamName}`;
  return `@${teamName}`;
}

export function canEditArticle(article: IArticle, userInfo: IUserInfo | null, canCreate: boolean): boolean {
  if (!userInfo || !canCreate) return false;
  if (isAdminUser(userInfo)) return true;
  if (article.authorMemberUid && article.authorMemberUid === userInfo.uid) return true;
  if (article.authorTeamUid && userInfo.leadingTeams?.includes(article.authorTeamUid)) return true;
  return false;
}
