'use client';

import React, { useState } from 'react';

import s from './ProfileDetails.module.scss';
import MemberDetailHeader from '@/components/page/member-details/member-detail-header';
import Bio from '@/components/page/member-details/bio';
import { clsx } from 'clsx';
import { IMember } from '@/types/members.types';
import { IUserInfo } from '@/types/shared.types';
import { EditProfileForm } from '@/components/page/member-details/ProfileDetails/components/EditProfileForm';
import { ProfileBio } from '@/components/page/member-details/ProfileDetails/components/ProfileBio';
import { ADMIN_ROLE } from '@/utils/constants';

interface Props {
  member: IMember;
  isLoggedIn: boolean;
  userInfo: IUserInfo;
}

export const ProfileDetails = ({ isLoggedIn, userInfo, member }: Props) => {
  const [editView, setEditView] = useState(false);
  const isAdmin = !!(userInfo?.roles && userInfo?.roles?.length > 0 && userInfo?.roles.includes(ADMIN_ROLE));
  const isOwner = userInfo?.uid === member.id;
  const isEditable = isOwner || isAdmin;

  return (
    <div
      className={clsx(s.root, {
        [s.editView]: editView,
      })}
    >
      {editView ? (
        <EditProfileForm onClose={() => setEditView(false)} member={member} userInfo={userInfo} />
      ) : (
        <>
          <MemberDetailHeader member={member} isLoggedIn={isLoggedIn} userInfo={userInfo} onEdit={() => setEditView(true)} />
          <ProfileBio bio={member.bio} isEditable={isEditable} />
        </>
      )}
    </div>
  );
};
