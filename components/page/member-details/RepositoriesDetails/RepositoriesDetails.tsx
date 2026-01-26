'use client';

import React from 'react';

import { IMember } from '@/types/members.types';
import { IUserInfo } from '@/types/shared.types';
import { ADMIN_ROLE } from '@/utils/constants';

import { RepositoriesList } from '@/components/page/member-details/RepositoriesDetails/components/RepositoriesList';
import { MemberDetailsSection } from '@/components/page/member-details/building-blocks/MemberDetailsSection';

import { getAccessLevel } from '@/utils/auth.utils';

interface Props {
  member: IMember;
  isLoggedIn: boolean;
  userInfo: IUserInfo;
}

export const RepositoriesDetails = ({ isLoggedIn, userInfo, member }: Props) => {
  const isAdmin = !!(userInfo?.roles && userInfo?.roles?.length > 0 && userInfo?.roles.includes(ADMIN_ROLE));
  const isOwner = userInfo?.uid === member.id;
  const isEditable = isOwner || isAdmin;

  if (!isLoggedIn || (getAccessLevel(userInfo, isLoggedIn) !== 'advanced' && !isOwner)) {
    return null;
  }

  return (
    <MemberDetailsSection>
      <RepositoriesList member={member} userInfo={userInfo} isEditable={isEditable} />
    </MemberDetailsSection>
  );
};
