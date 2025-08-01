'use client';

import React, { useState } from 'react';
import { clsx } from 'clsx';
import MemberDetailHeader from '@/components/page/member-details/member-detail-header';
import { IMember } from '@/types/members.types';
import { IUserInfo } from '@/types/shared.types';
import { EditProfileForm } from '@/components/page/member-details/ProfileDetails/components/EditProfileForm';
import { ProfileBio } from '@/components/page/member-details/ProfileDetails/components/ProfileBio';
import { ADMIN_ROLE } from '@/utils/constants';

import s from './ProfileDetails.module.scss';
import { useMemberAnalytics } from '@/analytics/members.analytics';
import { useMobileNavVisibility } from '@/hooks/useMobileNavVisibility';

interface Props {
  member: IMember;
  isLoggedIn: boolean;
  userInfo: IUserInfo;
}

export const ProfileDetails = ({ isLoggedIn, userInfo, member }: Props) => {
  const [editView, setEditView] = useState(false);
  const [generateBio, setGenerateBio] = useState(false);
  const isAdmin = !!(userInfo?.roles && userInfo?.roles?.length > 0 && userInfo?.roles.includes(ADMIN_ROLE));
  const isOwner = userInfo?.uid === member.id;
  const isEditable = isOwner || isAdmin;
  const hasMissingRequiredData = !member?.name || !member?.email;
  const showIncomplete = !editView && hasMissingRequiredData && isOwner;
  const { onEditProfileDetailsClicked } = useMemberAnalytics();
  useMobileNavVisibility(editView);

  return (
    <div
      className={clsx(s.root, {
        [s.editView]: editView,
        [s.missingData]: showIncomplete,
      })}
    >
      {editView ? (
        <EditProfileForm
          onClose={() => {
            setGenerateBio(false);
            setEditView(false);
          }}
          member={member}
          userInfo={userInfo}
          generateBio={generateBio}
        />
      ) : (
        <>
          {/*{showIncomplete && (*/}
          {/*  <div className={s.missingDataHeader}>*/}
          {/*    <WarningIcon />*/}
          {/*    Please complete your profile to get full access to the platform.*/}
          {/*  </div>*/}
          {/*)}*/}
          <MemberDetailHeader
            member={member}
            isLoggedIn={isLoggedIn}
            userInfo={userInfo}
            onEdit={() => {
              onEditProfileDetailsClicked();
              setEditView(true);
            }}
          />
          <ProfileBio
            bio={member.bio}
            isEditable={isEditable}
            hasMissingData={hasMissingRequiredData}
            onEdit={() => {
              setGenerateBio(true);
              setEditView(true);
            }}
          />
        </>
      )}
    </div>
  );
};
