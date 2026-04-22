'use client';

import React from 'react';

import { IMember } from '@/types/members.types';
import { IUserInfo } from '@/types/shared.types';

import { getAccessLevel } from '@/utils/auth.utils';
import { USE_ACCESS_CONTROL_V2 } from '@/utils/feature-flags';
import { useMemberContactsAccess } from '@/services/access-control/hooks/useMemberContactsAccess';
import { isAdminUser } from '@/utils/user/isAdminUser';

import { DetailsSection } from '@/components/common/profile/DetailsSection';
import { RepositoriesList } from '@/components/page/member-details/RepositoriesDetails/components/RepositoriesList';


interface Props {
  member: IMember;
  isLoggedIn: boolean;
  userInfo: IUserInfo;
}

export const RepositoriesDetails = ({ isLoggedIn, userInfo, member }: Props) => {
  const isAdmin = isAdminUser(userInfo)
  const isOwner = userInfo?.uid === member.id;
  const isEditable = isOwner || isAdmin;
  const { hasAccess: v2HasMemberContacts } = useMemberContactsAccess();

  if (!isLoggedIn || ((USE_ACCESS_CONTROL_V2 ? !v2HasMemberContacts : getAccessLevel(userInfo, isLoggedIn) !== 'advanced') && !isOwner)) {
    return null;
  }

  return (
    <DetailsSection>
      <RepositoriesList member={member} userInfo={userInfo} isEditable={isEditable} />
    </DetailsSection>
  );
};
