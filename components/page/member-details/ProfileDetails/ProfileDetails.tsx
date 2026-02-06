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

  // Truncate bio HTML content and append show more button inline
  const getTruncatedBio = (html: string, showButton: boolean): string => {
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

    let truncated = html.substring(0, cutIndex) + '...';

    // Remove trailing closing tags and add button before them
    if (showButton) {
      // Find and preserve closing tags at the end
      const closingTagsMatch = truncated.match(/(<\/[^>]+>)+$/);
      if (closingTagsMatch) {
        const closingTags = closingTagsMatch[0];
        const contentWithoutClosingTags = truncated.slice(0, -closingTags.length);
        truncated = contentWithoutClosingTags + ' <span class="bio-show-more">Show more</span>' + closingTags;
      } else {
        truncated += ' <span class="bio-show-more">Show more</span>';
      }
    }

    return truncated;
  };

  // Get full bio with show less button inline
  const getFullBioWithButton = (html: string): string => {
    // Find and preserve closing tags at the end
    const closingTagsMatch = html.match(/(<\/[^>]+>)+$/);
    if (closingTagsMatch) {
      const closingTags = closingTagsMatch[0];
      const contentWithoutClosingTags = html.slice(0, -closingTags.length);
      return contentWithoutClosingTags + ' <span class="bio-show-less">Show less</span>' + closingTags;
    }
    return html + ' <span class="bio-show-less">Show less</span>';
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
                onClick={(e) => {
                  const target = e.target as HTMLElement;
                  if (target.classList.contains('bio-show-more') || target.classList.contains('bio-show-less')) {
                    setIsBioExpanded(!isBioExpanded);
                  }
                }}
                dangerouslySetInnerHTML={{
                  __html: isBioTruncated
                    ? isBioExpanded
                      ? getFullBioWithButton(member.bio)
                      : getTruncatedBio(member.bio, true)
                    : member.bio,
                }}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};
