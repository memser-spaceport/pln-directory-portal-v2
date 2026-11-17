import { IMember } from '@/types/members.types';
import { IUserInfo } from '@/types/shared.types';

import { isAdminUser } from '@/utils/user/isAdminUser';

import { useValidateOfficeHoursQuery } from '@/services/members/hooks/useValidateOfficeHoursQuery';

interface Input {
  member: IMember;
  userInfo: IUserInfo | null;
  isLoggedIn: boolean;
}

const VALID_STATUSES: Array<IMember['ohStatus']> = ['OK', 'NOT_FOUND', null];

export function useIsOfficeHoursLinkValid(input: Input) {
  const { member, userInfo, isLoggedIn } = input;
  // The link check answers 403 to anyone but the owner or an admin (LAB-3006): other viewers skip it and can open the link.
  const canCheckLink = userInfo?.uid === member.id || isAdminUser(userInfo);
  const { data: checked } = useValidateOfficeHoursQuery(member?.id, isLoggedIn && canCheckLink);

  if (!canCheckLink) {
    return true;
  }

  return VALID_STATUSES.includes(checked ? checked.ohStatus : member.ohStatus);
}
