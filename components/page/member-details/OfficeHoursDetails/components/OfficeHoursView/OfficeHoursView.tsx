'use client';

import React from 'react';
import { clsx } from 'clsx';
import { IMember } from '@/types/members.types';
import { IUserInfo } from '@/types/shared.types';
import { EditButton } from '@/components/page/member-details/components/EditButton';

import s from './OfficeHoursView.module.scss';

interface Props {
  member: IMember;
  isLoggedIn: boolean;
  userInfo: IUserInfo;
  isEditable: boolean;
  showIncomplete: boolean;
  onEdit: () => void;
}

export const OfficeHoursView = ({ member, isLoggedIn, userInfo, isEditable, showIncomplete, onEdit }: Props) => {
  const hasOfficeHours = !!member.officeHours;
  const hasInterestedIn = !!member.officeHoursInterestedIn;
  const hasCanHelpWith = !!member.officeHoursCanHelpWith;

  function getDesc() {
    if (!hasOfficeHours) {
      return 'OH are short 15min 1:1 calls to connect about topics of interest or help others with your expertise. Share your calendar. You will also access other members OH';
    }

    if (hasOfficeHours) {
      return (
        <>
          {member.name} is available for a short 1:1 call to connect or help — no introduction needed.
          {member.officeHoursInterestedIn?.length ? `Open to talk about: ${member.officeHoursInterestedIn?.join(', ')}.` : ''}
          {member.officeHoursCanHelpWith?.length ? `Can help with: ${member.officeHoursCanHelpWith?.join(', ')}.` : ''}
        </>
      );
    }
  }

  return (
    <div
      className={clsx(s.root, {
        [s.missingData]: showIncomplete && isLoggedIn,
      })}
    >
      <div className={s.header}>
        <h2 className={s.title}>Office Hours</h2>
        {isLoggedIn && isEditable && <EditButton onClick={onEdit} incomplete={showIncomplete} />}
      </div>

      <div className={s.content}>
        <div className={s.officeHoursSection}>
          <div className={s.calendarIconWrapper}>
            <CalendarIcon />
          </div>
          <div className={s.col}>
            <h3 className={s.subTitle}>Office Hours</h3>
            <p>{getDesc()}</p>
          </div>
          <button className={s.primaryButton} disabled={!hasOfficeHours}>
            Schedule Meeting
          </button>
        </div>
      </div>
    </div>
  );
};

const CalendarIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M6.66667 5.83333V2.5V5.83333ZM13.3333 5.83333V2.5V5.83333ZM5.83333 9.16667H14.1667H5.83333ZM4.16667 17.5H15.8333C16.2754 17.5 16.6993 17.3244 17.0118 17.0118C17.3244 16.6993 17.5 16.2754 17.5 15.8333V5.83333C17.5 5.39131 17.3244 4.96738 17.0118 4.65482C16.6993 4.34226 16.2754 4.16667 15.8333 4.16667H4.16667C3.72464 4.16667 3.30072 4.34226 2.98816 4.65482C2.67559 4.96738 2.5 5.39131 2.5 5.83333V15.8333C2.5 16.2754 2.67559 16.6993 2.98816 17.0118C3.30072 17.3244 3.72464 17.5 4.16667 17.5Z"
      stroke="#1D4ED8"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
