'use client';

import { clsx } from 'clsx';
import DOMPurify from 'isomorphic-dompurify';

import { isBlankHtml } from '@/utils/html';
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
  userInfo: IUserInfo | null;
  variant?: 'investor-drawer' | 'apply-flow';
}

export const ProfileDetails = ({ isLoggedIn, userInfo, member, variant }: Props) => {
  const [editView, setEditView] = useState(false);

  const bioRef = useRef<HTMLDivElement>(null);

  const isOwner = userInfo?.uid === member.id;
  const hasMissingRequiredData = !member?.name || !member?.email;
  const showIncomplete = !editView && hasMissingRequiredData && isOwner;
  const { onEditProfileDetailsClicked } = useMemberAnalytics();
  useMobileNavVisibility(editView);
  /* "Renders as nothing" rather than "equals Quill's empty value".
     The old test only knew one sentinel, `<p><br></p>`, so a bio saved as
     `<p></p>` — or a couple of blank paragraphs — was truthy, passed, and drew
     the Bio heading over an empty grey box. Same class of bug as the forum's
     blank paragraphs: rich text is never an empty string, it is empty markup.

     `isBlankHtml` strips tags, so a bio that is *only* an image would read as
     blank; the second test keeps that one visible, since an image is something
     a reader can see even though it has no text. */
  const hasBio = !!member.bio && (!isBlankHtml(member.bio) || /<img\b/i.test(member.bio));

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
          userInfo={userInfo!}
          variant={variant}
        />
      ) : (
        <>
          <MemberDetailHeader
            member={member}
            isLoggedIn={isLoggedIn}
            userInfo={userInfo!}
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
                {/* Sanitize-on-read, like the experience descriptions one section
                    down: the bio is member-authored rich text and this is a new
                    execution context for whatever is stored in it. */}
                <div className={s.bioContent} dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(member.bio) }} />
              </ExpandableDescription>
            </div>
          )}
        </>
      )}
    </div>
  );
};
