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
  const hasMissingRequiredData = !member?.name || !member?.email || !member.skills.length;
  const showIncomplete = !editView && hasMissingRequiredData && isOwner;

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
          {showIncomplete && (
            <div className={s.missingDataHeader}>
              <WarningIcon />
              Please complete your profile to get full access to the platform.
            </div>
          )}
          <MemberDetailHeader member={member} isLoggedIn={isLoggedIn} userInfo={userInfo} onEdit={() => setEditView(true)} />
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

const WarningIcon = () => {
  return (
    <svg width="15" height="13" viewBox="0 0 15 13" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M7.5 0.625C7.88281 0.625 8.23828 0.84375 8.42969 1.17188L14.3359 11.2344C14.5273 11.5898 14.5273 12 14.3359 12.3281C14.1445 12.6836 13.7891 12.875 13.4062 12.875H1.59375C1.18359 12.875 0.828125 12.6836 0.636719 12.3281C0.445312 12 0.445312 11.5898 0.636719 11.2344L6.54297 1.17188C6.73438 0.84375 7.08984 0.625 7.5 0.625ZM7.5 4.125C7.11719 4.125 6.84375 4.42578 6.84375 4.78125V7.84375C6.84375 8.22656 7.11719 8.5 7.5 8.5C7.85547 8.5 8.15625 8.22656 8.15625 7.84375V4.78125C8.15625 4.42578 7.85547 4.125 7.5 4.125ZM8.375 10.25C8.375 9.78516 7.96484 9.375 7.5 9.375C7.00781 9.375 6.625 9.78516 6.625 10.25C6.625 10.7422 7.00781 11.125 7.5 11.125C7.96484 11.125 8.375 10.7422 8.375 10.25Z"
        fill="#0F172A"
      />
    </svg>
  );
};
