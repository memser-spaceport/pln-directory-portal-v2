'use client';

import React, { useState } from 'react';
import { IMember } from '@/types/members.types';
import { IUserInfo } from '@/types/shared.types';

import { isAdminUser } from '@/utils/user/isAdminUser';

import { useMemberAnalytics } from '@/analytics/members.analytics';
import { useMobileNavVisibility } from '@/hooks/useMobileNavVisibility';

import { DetailsSection } from '@/components/common/profile/DetailsSection';
import { BioView } from '@/components/page/member-details/BioDetails/components/BioView';
import { EditBioForm } from '@/components/page/member-details/BioDetails/components/EditBioForm';

interface Props {
  member: IMember;
  isLoggedIn: boolean;
  userInfo: IUserInfo;
}

export const BioDetails = ({ isLoggedIn, userInfo, member }: Props) => {
  const [editView, setEditView] = useState(false);
  const [generateBio, setGenerateBio] = useState(false);
  const isAdmin = isAdminUser(userInfo)
  const isOwner = userInfo?.uid === member.id;
  const isEditable = isOwner || isAdmin;
  const hasMissingData = !member?.bio;
  const showIncomplete = !editView && hasMissingData && isOwner;
  const { onEditProfileDetailsClicked } = useMemberAnalytics();
  useMobileNavVisibility(editView);

  if (!isLoggedIn) {
    return null;
  }

  return (
    <DetailsSection editView={editView}>
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
    </DetailsSection>
  );
};
