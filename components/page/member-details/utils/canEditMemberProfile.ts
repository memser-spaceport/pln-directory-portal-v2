import { IMember } from '@/types/members.types';
import { IUserInfo } from '@/types/shared.types';
import { isAdminUser } from '@/utils/user/isAdminUser';
import { isMemberProfileOwner } from '@/components/page/member-details/utils/isMemberProfileOwner';

export function canEditMemberProfile(userInfo: IUserInfo, member: IMember) {
  const isAdmin = isAdminUser(userInfo);
  const isOwner = isMemberProfileOwner(userInfo, member);

  return  isOwner || isAdmin;
}
