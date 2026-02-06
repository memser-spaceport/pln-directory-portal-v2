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

const BIO_MAX_LENGTH = 300;

interface Props {
  member: IMember;
  isLoggedIn: boolean;
  userInfo: IUserInfo;
}

export const ProfileDetails = ({ isLoggedIn, userInfo, member }: Props) => {
  const [editView, setEditView] = useState(false);
  const [isBioExpanded, setIsBioExpanded] = useState(false);

  const isOwner = userInfo?.uid === member.id;
  const hasMissingRequiredData = !member?.name || !member?.email;
  const showIncomplete = !editView && hasMissingRequiredData && isOwner;
  const { onEditProfileDetailsClicked } = useMemberAnalytics();
  useMobileNavVisibility(editView);
  const hasBio = !!member.bio && member.bio.trim() !== '<p><br></p>';

  // Strip HTML tags to get plain text length
  const bioPlainText = member.bio ? member.bio.replace(/<[^>]*>/g, '') : '';
  const isBioTruncated = bioPlainText.length > BIO_MAX_LENGTH;

  // Truncate bio HTML content
  const getTruncatedBio = (html: string): string => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    const text = tempDiv.textContent || '';
    if (text.length <= BIO_MAX_LENGTH) return html;

    // Find position to cut in original HTML
    let charCount = 0;
    let cutIndex = 0;
    let inTag = false;

    for (let i = 0; i < html.length; i++) {
      if (html[i] === '<') inTag = true;
      if (!inTag) {
        charCount++;
        if (charCount >= BIO_MAX_LENGTH) {
          cutIndex = i + 1;
          break;
        }
      }
      if (html[i] === '>') inTag = false;
    }

    return html.substring(0, cutIndex) + '...';
  };

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
          {hasBio && member.bio && (
            <div className={s.bioContainer}>
              <div className={s.bioTitle}>Bio</div>
              <div
                className={s.bioContent}
                dangerouslySetInnerHTML={{
                  __html: isBioExpanded ? member.bio : getTruncatedBio(member.bio),
                }}
              />
              {isBioTruncated && (
                <button type="button" className={s.showMoreButton} onClick={() => setIsBioExpanded(!isBioExpanded)}>
                  {isBioExpanded ? 'Show less' : 'Show more'}
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};
