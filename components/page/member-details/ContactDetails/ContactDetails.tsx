'use client';

import React, { useState } from 'react';
import { IMember } from '@/types/members.types';
import { IUserInfo } from '@/types/shared.types';
import { ContactDetails as ContactDetailsView } from '@/components/page/member-details/contact-details';
import { MemberProfileLoginStrip } from '@/components/page/member-details/member-details-login-strip';
import { EditContactForm } from '@/components/page/member-details/ContactDetails/components/EditContactForm';
import { MemberDetailsSection } from '@/components/page/member-details/building-blocks/MemberDetailsSection';

import s from './ContactDetails.module.scss';
import { useMemberAnalytics } from '@/analytics/members.analytics';
import { useMobileNavVisibility } from '@/hooks/useMobileNavVisibility';
import { useEditSectionParam } from '@/hooks/useEditSectionParam';

interface Props {
  member: IMember;
  isLoggedIn: boolean;
  userInfo: IUserInfo;
}

export const ContactDetails = ({ isLoggedIn, userInfo, member }: Props) => {
  const [editView, setEditView] = useState(false);
  const { onEditContactDetailsClicked } = useMemberAnalytics();
  useMobileNavVisibility(editView);
  useEditSectionParam('contact-details', () => setEditView(true));

  return (
    <MemberDetailsSection editView={editView} classes={{ root: s.root }} id="contact-details">
      {!isLoggedIn && <MemberProfileLoginStrip member={member} variant="secondary" />}
      {editView ? (
        <EditContactForm onClose={() => setEditView(false)} member={member} userInfo={userInfo} />
      ) : (
        <ContactDetailsView
          member={member}
          isLoggedIn={isLoggedIn}
          userInfo={userInfo}
          onEdit={() => {
            onEditContactDetailsClicked();
            setEditView(true);
          }}
        />
      )}
    </MemberDetailsSection>
  );
};
