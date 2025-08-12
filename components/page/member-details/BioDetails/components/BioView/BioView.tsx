'use client';

import React from 'react';
import { clsx } from 'clsx';
import { IMember } from '@/types/members.types';
import { IUserInfo } from '@/types/shared.types';
import { EditButton } from '@/components/page/member-details/components/EditButton';

import s from './BioView.module.scss';

interface Props {
  member: IMember;
  isLoggedIn: boolean;
  userInfo: IUserInfo;
  isEditable: boolean;
  showIncomplete: boolean;
  onEdit: () => void;
  onGenerateBio: () => void;
}

export const BioView = ({ member, isLoggedIn, userInfo, isEditable, showIncomplete, onEdit, onGenerateBio }: Props) => {
  const hasBio = !!member.bio;

  return (
    <div className={s.root}>
      <div className={s.header}>
        <h2 className={s.title}>Bio</h2>
        {isLoggedIn && isEditable && <EditButton onClick={onEdit} />}
      </div>

      <div className={clsx(s.content)}>
        {hasBio && member.bio ? (
          <div className={s.bioContent} dangerouslySetInnerHTML={{ __html: member.bio }} />
        ) : (
          <div className={s.officeHoursSection}>
            <div className={s.col}>
              <p>Tell others who you are, what you’re working on, and what you’re looking to connect around.</p>
            </div>
            {showIncomplete && (
              <button className={s.primaryButton} onClick={onEdit}>
                Gen Bio with AI
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
