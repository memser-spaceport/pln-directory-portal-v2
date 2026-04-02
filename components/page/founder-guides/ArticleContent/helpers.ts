import { IArticle } from '@/types/articles.types';
import { IUserInfo } from '@/types/shared.types';
import { isAdminUser } from '@/utils/user/isAdminUser';

export function canEditArticle(article: IArticle, userInfo: IUserInfo | null, canCreate: boolean): boolean {
  if (!userInfo || !canCreate) return false;
  if (isAdminUser(userInfo)) return true;
  if (article.authorMemberUid && article.authorMemberUid === userInfo.uid) return true;
  if (article.authorTeamUid && userInfo.leadingTeams?.includes(article.authorTeamUid)) return true;
  return false;
}
