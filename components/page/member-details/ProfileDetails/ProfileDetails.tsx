'use client';

import React, { useRef, useState, useEffect } from 'react';
import { clsx } from 'clsx';
import { MemberDetailHeader } from '@/components/page/member-details/MemberDetailHeader';
import { IMember } from '@/types/members.types';
import { IUserInfo } from '@/types/shared.types';
import { EditProfileForm } from '@/components/page/member-details/ProfileDetails/components/EditProfileForm';

import s from './ProfileDetails.module.scss';
import { useMemberAnalytics } from '@/analytics/members.analytics';
import { useMobileNavVisibility } from '@/hooks/useMobileNavVisibility';
import { useEditSectionListener } from '@/hooks/useEditSectionParam';

const BIO_COLLAPSED_HEIGHT = 120;

interface Props {
  member: IMember;
  isLoggedIn: boolean;
  userInfo: IUserInfo;
}

export const ProfileDetails = ({ isLoggedIn, userInfo, member }: Props) => {
  const [editView, setEditView] = useState(false);
  const [isBioExpanded, setIsBioExpanded] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const bioRef = useRef<HTMLDivElement>(null);

  const isOwner = userInfo?.uid === member.id;
  const hasMissingRequiredData = !member?.name || !member?.email;
  const showIncomplete = !editView && hasMissingRequiredData && isOwner;
  const { onEditProfileDetailsClicked } = useMemberAnalytics();
  useMobileNavVisibility(editView);
  useEditSectionListener('profile', () => setEditView(true));
  const hasBio = !!member.bio && member.bio.trim() !== '<p><br></p>';

  useEffect(() => {
    if (bioRef.current) {
      setIsOverflowing(bioRef.current.scrollHeight > BIO_COLLAPSED_HEIGHT);
    }
  }, [member.bio]);

  return (
    <div
      id="profile"
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
          <MemberDetailHeader
            member={member}
            isLoggedIn={isLoggedIn}
            userInfo={userInfo}
            onEdit={() => {
              onEditProfileDetailsClicked();
              setEditView(true);
            }}
          />
          {hasBio && member.bio && (
            <div className={s.bioContainer}>
              <div className={s.bioTitle}>Bio</div>
              <div className={clsx(s.bioContentWrapper, { [s.collapsed]: !isBioExpanded && isOverflowing })}>
                <div ref={bioRef} className={s.bioContent} dangerouslySetInnerHTML={{ __html: member.bio }} />
                {!isBioExpanded && isOverflowing && <div className={s.bioGradient} />}
                {isOverflowing && (
                  <button className={s.bioToggleButton} onClick={() => setIsBioExpanded(!isBioExpanded)}>
                    {isBioExpanded ? 'Show less' : 'Show more'}
                  </button>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
