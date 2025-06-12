'use client';

import React, { useState } from 'react';

import { clsx } from 'clsx';
import { IMember } from '@/types/members.types';
import { IUserInfo } from '@/types/shared.types';
import { EditProfileForm } from '@/components/page/member-details/ProfileDetails/components/EditProfileForm';
import { ADMIN_ROLE } from '@/utils/constants';
import { ContactDetails as ContactDetailsView } from '@/components/page/member-details/contact-details';

import s from './ContactDetails.module.scss';
import { MemberProfileLoginStrip } from '@/components/page/member-details/member-details-login-strip';
import { EditContactForm } from '@/components/page/member-details/ContactDetails/components/EditContactForm';

interface Props {
  member: IMember;
  isLoggedIn: boolean;
  userInfo: IUserInfo;
}

export const ContactDetails = ({ isLoggedIn, userInfo, member }: Props) => {
  const [editView, setEditView] = useState(false);
  const isAdmin = !!(userInfo?.roles && userInfo?.roles?.length > 0 && userInfo?.roles.includes(ADMIN_ROLE));
  const isOwner = userInfo?.uid === member.id;
  const isEditable = isOwner || isAdmin;

  return (
    <>
      {!isLoggedIn && <MemberProfileLoginStrip member={member} variant="secondary" />}
      <div
        id="contact-details"
        className={clsx(s.root, {
          [s.editView]: editView,
        })}
      >
        {editView ? (
          <EditContactForm onClose={() => setEditView(false)} member={member} userInfo={userInfo} />
        ) : (
          <ContactDetailsView member={member} isLoggedIn={isLoggedIn} userInfo={userInfo} onEdit={() => setEditView(true)} />
        )}
      </div>
    </>
  );
};
