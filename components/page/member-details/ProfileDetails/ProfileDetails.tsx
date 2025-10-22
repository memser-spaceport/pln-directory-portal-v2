'use client';

import React, { useState } from 'react';
import { clsx } from 'clsx';
import { MemberDetailHeader } from '@/components/page/member-details/MemberDetailHeader';
import { IMember } from '@/types/members.types';
import { IUserInfo } from '@/types/shared.types';
import { EditProfileForm } from '@/components/page/member-details/ProfileDetails/components/EditProfileForm';
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
  const isOwner = userInfo?.uid === member.id;
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
            setEditView(false);
          }}
          member={member}
          userInfo={userInfo}
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
        </>
      )}
    </div>
  );
};
