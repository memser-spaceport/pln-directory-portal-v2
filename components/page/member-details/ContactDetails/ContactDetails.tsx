'use client';

import React, { useState } from 'react';
import { clsx } from 'clsx';
import { IMember } from '@/types/members.types';
import { IUserInfo } from '@/types/shared.types';
import { ContactDetails as ContactDetailsView } from '@/components/page/member-details/contact-details';
import { MemberProfileLoginStrip } from '@/components/page/member-details/member-details-login-strip';
import { EditContactForm } from '@/components/page/member-details/ContactDetails/components/EditContactForm';

import s from './ContactDetails.module.scss';

interface Props {
  member: IMember;
  isLoggedIn: boolean;
  userInfo: IUserInfo;
}

export const ContactDetails = ({ isLoggedIn, userInfo, member }: Props) => {
  const [editView, setEditView] = useState(false);

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
