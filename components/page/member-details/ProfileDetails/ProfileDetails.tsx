'use client';

import { clsx } from 'clsx';
import React, { useRef, useState } from 'react';

import { MemberDetailHeader } from '@/components/page/member-details/MemberDetailHeader';
import { IMember } from '@/types/members.types';
import { IUserInfo } from '@/types/shared.types';
import { EditProfileForm } from '@/components/page/member-details/ProfileDetails/components/EditProfileForm';

import { useMemberAnalytics } from '@/analytics/members.analytics';
import { useMobileNavVisibility } from '@/hooks/useMobileNavVisibility';
import { ExpandableDescription } from '@/components/common/ExpandableDescription';

import s from './ProfileDetails.module.scss';

interface Props {
  member: IMember;
  isLoggedIn: boolean;
  userInfo: IUserInfo;
  variant?: 'investor-drawer';
}

export const ProfileDetails = ({ isLoggedIn, userInfo, member, variant }: Props) => {
  const [editView, setEditView] = useState(false);

  const bioRef = useRef<HTMLDivElement>(null);

  const isOwner = userInfo?.uid === member.id;
  const hasMissingRequiredData = !member?.name || !member?.email;
  const showIncomplete = !editView && hasMissingRequiredData && isOwner;
  const { onEditProfileDetailsClicked } = useMemberAnalytics();
  useMobileNavVisibility(editView);
  const hasBio = !!member.bio && member.bio.trim() !== '<p><br></p>';

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
          variant={variant}
        />
      ) : (
        <>
          <MemberDetailHeader
            member={member}
            isLoggedIn={isLoggedIn}
            userInfo={userInfo}
            onEdit={() => {
              onEditProfileDetailsClicked();
              setEditView(true);
            }}
            variant={variant}
          />
          {hasBio && member.bio && variant !== 'investor-drawer' && (
            <div className={s.bioContainer}>
              <div className={s.bioTitle}>Bio</div>
              <ExpandableDescription>
                <div className={s.bioContent} dangerouslySetInnerHTML={{ __html: member.bio }} />
              </ExpandableDescription>
            </div>
          )}
        </>
      )}
    </div>
  );
};
