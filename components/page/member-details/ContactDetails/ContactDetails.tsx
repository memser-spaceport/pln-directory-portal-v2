'use client';

import React, { useState } from 'react';
import { IMember } from '@/types/members.types';
import { IUserInfo } from '@/types/shared.types';
import { ContactDetails as ContactDetailsView } from '@/components/page/member-details/contact-details';
import { MemberProfileLoginStrip } from '@/components/page/member-details/member-details-login-strip';
import { EditContactForm } from '@/components/page/member-details/ContactDetails/components/EditContactForm';

import s from './ContactDetails.module.scss';
import { useMemberAnalytics } from '@/analytics/members.analytics';
import { useMobileNavVisibility } from '@/hooks/useMobileNavVisibility';
import { DetailsSection } from '@/components/common/profile/DetailsSection';
import { useCurrentUserStore } from '@/services/auth/store';
import { isJobAspirant } from '@/services/jobs/job-board-viewer';

export type ContactDetailsVariant = 'default' | 'drawer';

interface Props {
  member: IMember;
  isLoggedIn: boolean;
  userInfo: IUserInfo | null;
  variant?: ContactDetailsVariant;
}

export const ContactDetails = ({ isLoggedIn, userInfo, member, variant = 'default' }: Props) => {
  const [editView, setEditView] = useState(false);
  const { onEditContactDetailsClicked } = useMemberAnalytics();
  const { currentUser } = useCurrentUserStore();
  useMobileNavVisibility(editView);

  const isDrawer = variant === 'drawer';
  const isOwner = !!currentUser && currentUser.uid === member.id;

  /* A Job Aspirant is never shown someone else's contacts — not even blurred.
     The `job_aspirant` policy is the only one of 21 without
     `member.contacts.read`, so the teaser was advertising a panel they can
     never unlock; the whole section goes rather than the handles inside it.
     Gated on `isJobAspirant` (synchronous, cookie-backed) and not on
     `rbac.status`, because a plain PENDING member is awaiting an approval that
     will come and keeps the teaser. The drawer variant is the viewer's own
     profile in the job-board and investor flows, and `isOwner` is the same
     profile reached by URL — both keep their contacts. */
  if (!isDrawer && !isOwner && isJobAspirant(currentUser)) {
    return null;
  }

  return (
    <DetailsSection editView={editView} classes={{ root: s.root, editView: s.editView }}>
      {!isLoggedIn && !isDrawer && <MemberProfileLoginStrip member={member} variant="secondary" />}
      {editView ? (
        <EditContactForm
          onClose={() => setEditView(false)}
          member={member}
          userInfo={userInfo!}
          linkedinRequired={false}
          variant={variant}
        />
      ) : (
        <ContactDetailsView
          member={member}
          isLoggedIn={isLoggedIn}
          userInfo={userInfo!}
          variant={variant}
          onEdit={() => {
            onEditContactDetailsClicked();
            setEditView(true);
          }}
        />
      )}
    </DetailsSection>
  );
};
