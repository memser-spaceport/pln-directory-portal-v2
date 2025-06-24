'use client';

import React from 'react';
import { clsx } from 'clsx';
import { IMember } from '@/types/members.types';
import { IUserInfo } from '@/types/shared.types';

import s from './OneClickVerification.module.scss';

interface Props {
  member: IMember;
  isLoggedIn: boolean;
  userInfo: IUserInfo;
}

export const OneClickVerification = ({ isLoggedIn, userInfo, member }: Props) => {
  const isOwner = userInfo?.uid === member.id;
  const hasMissingRequiredData = !member?.linkedinHandle;
  const showIncomplete = hasMissingRequiredData && isOwner;

  if (!showIncomplete) {
    return null;
  }

  return (
    <div
      className={clsx(s.root, {
        [s.missingData]: showIncomplete,
      })}
    >
      <div className={s.missingDataHeader}>
        <WarningIcon />
        You need to verify your profile to make it visible to others
      </div>
      <div className={s.content}>
        <div className={s.label}>
          <ArrowIcon /> One-click verification
        </div>
        <div className={clsx(s.body)}>
          <div className={s.row}>
            <p>Connect your LinkedIn profile to verify who you are and make your profile visible to others.</p>
            <button className={s.btn} onClick={() => {}}>
              <LinkedInIcon /> LinkedIn
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const WarningIcon = () => {
  return (
    <svg width="15" height="13" viewBox="0 0 15 13" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M7.5 0.625C7.88281 0.625 8.23828 0.84375 8.42969 1.17188L14.3359 11.2344C14.5273 11.5898 14.5273 12 14.3359 12.3281C14.1445 12.6836 13.7891 12.875 13.4062 12.875H1.59375C1.18359 12.875 0.828125 12.6836 0.636719 12.3281C0.445312 12 0.445312 11.5898 0.636719 11.2344L6.54297 1.17188C6.73438 0.84375 7.08984 0.625 7.5 0.625ZM7.5 4.125C7.11719 4.125 6.84375 4.42578 6.84375 4.78125V7.84375C6.84375 8.22656 7.11719 8.5 7.5 8.5C7.85547 8.5 8.15625 8.22656 8.15625 7.84375V4.78125C8.15625 4.42578 7.85547 4.125 7.5 4.125ZM8.375 10.25C8.375 9.78516 7.96484 9.375 7.5 9.375C7.00781 9.375 6.625 9.78516 6.625 10.25C6.625 10.7422 7.00781 11.125 7.5 11.125C7.96484 11.125 8.375 10.7422 8.375 10.25Z"
        fill="#0F172A"
      />
    </svg>
  );
};

const LinkedInIcon = () => {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="10" cy="10" r="10" fill="#F19C0B" />
      <path
        d="M7.43989 14.1622H5.16301V7.49968H7.43989V14.1622ZM6.29987 6.5764C6.0416 6.57506 5.78955 6.50327 5.57552 6.3701C5.3615 6.23692 5.19509 6.04832 5.09731 5.82811C4.99953 5.60789 4.97475 5.36593 5.0261 5.13276C5.07745 4.89958 5.20264 4.68565 5.38585 4.51795C5.56907 4.35025 5.8021 4.23631 6.05555 4.1905C6.30899 4.14469 6.57149 4.16907 6.80991 4.26056C7.04833 4.35205 7.25198 4.50655 7.39517 4.70456C7.53837 4.90257 7.61468 5.13522 7.61447 5.37315C7.61691 5.53244 7.58451 5.69055 7.5192 5.83806C7.45389 5.98557 7.35701 6.11946 7.23433 6.23174C7.11166 6.34402 6.9657 6.43241 6.80516 6.49162C6.64461 6.55084 6.47277 6.57967 6.29987 6.5764ZM15.8323 14.168H13.5565V10.5282C13.5565 9.45473 13.0611 9.12339 12.4217 9.12339C11.7465 9.12339 11.084 9.5923 11.084 10.5553V14.168H8.80707V7.50452H10.9967V8.42779H11.0261C11.2459 8.01799 12.0157 7.31754 13.1905 7.31754C14.4609 7.31754 15.8333 8.01217 15.8333 10.0467L15.8323 14.168Z"
        fill="white"
      />
    </svg>
  );
};

const ArrowIcon = () => (
  <svg width="10" height="14" viewBox="0 0 10 14" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M0.625 1.28125C0.625 0.925781 0.898438 0.625 1.25391 0.625C1.39062 0.625 1.55469 0.707031 1.66406 0.789062L9.15625 7.46094C9.29297 7.57031 9.375 7.73438 9.375 7.89844C9.375 8.25391 9.10156 8.5 8.74609 8.5H5.51953L7.07812 11.6172C7.29688 12.0547 7.13281 12.5742 6.69531 12.793C6.25781 13.0117 5.73828 12.8477 5.51953 12.4102L3.93359 9.21094L1.66406 11.8086C1.55469 11.9453 1.39062 12 1.22656 12C0.871094 12 0.625 11.7539 0.625 11.3984V1.28125Z"
      fill="#0F172A"
    />
  </svg>
);
