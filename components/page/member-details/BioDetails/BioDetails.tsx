'use client';

import React, { useState } from 'react';
import { clsx } from 'clsx';
import { IMember } from '@/types/members.types';
import { IUserInfo } from '@/types/shared.types';
import { BioView } from '@/components/page/member-details/BioDetails/components/BioView';
import { EditBioForm } from '@/components/page/member-details/BioDetails/components/EditBioForm';
import { ADMIN_ROLE } from '@/utils/constants';

import s from './BioDetails.module.scss';
import { useMemberAnalytics } from '@/analytics/members.analytics';
import { useMobileNavVisibility } from '@/hooks/useMobileNavVisibility';

interface Props {
  member: IMember;
  isLoggedIn: boolean;
  userInfo: IUserInfo;
}

export const BioDetails = ({ isLoggedIn, userInfo, member }: Props) => {
  const [editView, setEditView] = useState(false);
  const [generateBio, setGenerateBio] = useState(false);
  const isAdmin = !!(userInfo?.roles && userInfo?.roles?.length > 0 && userInfo?.roles.includes(ADMIN_ROLE));
  const isOwner = userInfo?.uid === member.id;
  const isEditable = isOwner || isAdmin;
  const hasMissingData = !member?.bio;
  const showIncomplete = !editView && hasMissingData && isOwner;
  const { onEditProfileDetailsClicked } = useMemberAnalytics();
  useMobileNavVisibility(editView);

  return (
    <div
      className={clsx(s.root, {
        [s.editView]: editView,
      })}
    >
      {editView ? (
        <EditBioForm
          onClose={() => {
            setGenerateBio(false);
            setEditView(false);
          }}
          member={member}
          userInfo={userInfo}
          generateBio={generateBio}
        />
      ) : (
        <BioView
          member={member}
          isLoggedIn={isLoggedIn}
          userInfo={userInfo}
          isEditable={isEditable}
          showIncomplete={showIncomplete}
          onEdit={() => {
            onEditProfileDetailsClicked();
            setEditView(true);
          }}
          onGenerateBio={() => {
            setGenerateBio(true);
            setEditView(true);
          }}
        />
      )}
    </div>
  );
};
