'use client';

import React from 'react';

import { IUserInfo } from '@/types/shared.types';
import { HighlightsBar } from '@/components/core/navbar/components/HighlightsBar';
import { getAccessLevel } from '@/utils/auth.utils';

import s from './CompleteYourProfile.module.scss';

interface Props {
  userInfo: IUserInfo;
}

const MESSAGES: Record<string, string> = {
  L0: 'Access limited - please verify your identity to begin the review process.',
  L1: "Access limited - profile under review. You'll be notified once approved.",
};

export const CompleteYourProfile = ({ userInfo }: Props) => {
  const accessLevel = getAccessLevel(userInfo, true);

  if (!userInfo || accessLevel !== 'base' || !userInfo.accessLevel) {
    return null;
  }

  const message = MESSAGES[userInfo.accessLevel];

  if (!message) {
    return null;
  }

  return (
    <HighlightsBar variant="secondary">
      <div className={s.root}>
        <div className={s.left}>
          <UserIcon />
          <span className={s.description}>{message}</span>
        </div>
      </div>
    </HighlightsBar>
  );
};

const UserIcon = () => (
  <svg width="26" height="21" viewBox="0 0 26 21" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M8.75 10.5C6.95312 10.5 5.3125 9.5625 4.41406 8C2.46094 4.67969 4.88281 0.5 8.75 0.5C10.5078 0.5 12.1484 1.47656 13.0469 3C15 6.35938 12.5781 10.5 8.75 10.5ZM6.95312 12.375H10.5078C10.7812 12.375 11.0156 12.4141 11.25 12.4141C11.25 12.6094 11.25 12.8047 11.25 13C11.25 16.4766 14.0234 19.25 17.5 19.25C17.5 19.2891 17.5 19.3281 17.5 19.3672C17.5 19.9922 16.9531 20.5 16.3281 20.5H1.13281C0.507812 20.5 0 19.9922 0 19.3672C0 15.5 3.08594 12.375 6.95312 12.375ZM17.5 9.91406C16.3672 9.91406 15.3516 10.5 14.7656 11.4766C13.5547 13.5469 15.0781 16.1641 17.5 16.1641C18.5938 16.1641 19.6094 15.5391 20.1953 14.6016C21.4062 12.4922 19.8828 9.91406 17.5 9.91406ZM17.5 18.0391H17.4609C14.7266 18.0391 12.4609 15.7734 12.4609 13.0391C12.4609 10.2656 14.7266 8.03906 17.4609 8.03906C20.2344 8.03906 22.4609 10.2656 22.4609 13.0391C22.4609 14.0547 22.1484 15.0312 21.6016 15.8516L24.6875 18.9375C25.0781 19.2891 25.0781 19.875 24.6875 20.2656C24.3359 20.6172 23.75 20.6172 23.3984 20.2656L20.2734 17.1406C19.4922 17.6875 18.5156 18.0391 17.5 18.0391Z"
      fill="#FF820E"
    />
  </svg>
);

const ChevronDownIcon = () => (
  <svg width="12" height="7" viewBox="0 0 12 7" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M0.3125 1.49219L5.53516 6.49609C5.69922 6.63281 5.86328 6.6875 6 6.6875C6.16406 6.6875 6.32812 6.63281 6.46484 6.52344L11.7148 1.49219C11.9883 1.24609 11.9883 0.808594 11.7422 0.5625C11.4961 0.289062 11.0586 0.289062 10.8125 0.535156L6 5.12891L1.21484 0.535156C0.96875 0.289062 0.53125 0.289062 0.285156 0.5625C0.0390625 0.808594 0.0390625 1.24609 0.3125 1.49219Z"
      fill="white"
      fillOpacity="0.8"
    />
  </svg>
);
