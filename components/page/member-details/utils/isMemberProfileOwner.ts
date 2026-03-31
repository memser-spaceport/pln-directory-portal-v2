import { IMember } from '@/types/members.types';
import { IUserInfo } from '@/types/shared.types';

export function isMemberProfileOwner(userInfo: IUserInfo, member: IMember) {
  return userInfo?.uid === member.id;
}
