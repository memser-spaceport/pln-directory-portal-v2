'use client';

import React, { useCallback, useState } from 'react';

import s from './CompleteYourProfile.module.scss';
import { useMemberNotificationsSettings } from '@/services/members/hooks/useMemberNotificationsSettings';
import { IUserInfo } from '@/types/shared.types';
import { useUpdateMemberNotificationsSettings } from '@/services/members/hooks/useUpdateMemberNotificationsSettings';
import { useQueryClient } from '@tanstack/react-query';
import { MembersQueryKeys } from '@/services/members/constants';
import { usePathname, useRouter } from 'next/navigation';
import { HighlightsBar } from '@/components/core/navbar/components/HighlightsBar';
import { clsx } from 'clsx';
import { useMember } from '@/services/members/hooks/useMember';
import { useLocalStorageParam } from '@/hooks/useLocalStorageParam';

interface Props {
  userInfo: IUserInfo;
}

export const CompleteYourProfile = ({ userInfo }: Props) => {
  const [open, setOpen] = useState(false);
  const { data: member, isLoading } = useMember(userInfo.uid);
  const [hideCompleteProfile, setHideCompleteProfile] = useLocalStorageParam('complete_profile_bar', false);
  const router = useRouter();

  const handleClose = useCallback(async () => {
    if (!userInfo) {
      return;
    }

    setHideCompleteProfile(true);
  }, [setHideCompleteProfile, userInfo]);

  const isProfileFilled = member?.memberInfo.telegramHandler && member?.memberInfo.officeHours && member?.memberInfo.skills.length > 0;

  if (!userInfo || isProfileFilled || hideCompleteProfile || isLoading) {
    return null;
  }

  return (
    <HighlightsBar>
      <div className={s.root}>
        <div className={s.left}>
          <UserIcon />
          <span className={s.title}>Complete your profile</span>
          <span className={s.description}>It helps increase your visibility and the quality of recommended connections.</span>
        </div>
        <div className={s.right}>
          <button className={s.btn} onClick={handleClose}>
            Not now
          </button>
          {!open && (
            <button
              className={clsx(s.btn, s.primary)}
              onClick={() => {
                router.push(`/members/${userInfo.uid}`);
              }}
            >
              Go to Profile
            </button>
          )}
        </div>
      </div>
      <div className={s.mobileDetails}>
        {!open ? (
          <button className={s.control} onClick={() => setOpen(!open)}>
            View More <ChevronDownIcon />
          </button>
        ) : (
          <>
            <div className={s.mobileDescWrapper}>
              <span className={s.description}>It helps increase your visibility and the quality of recommended connections.</span>
            </div>

            <div className={s.right}>
              <button className={s.btn} onClick={handleClose}>
                Not now
              </button>
              <button
                className={clsx(s.btn, s.primary)}
                onClick={() => {
                  router.push(`/members/${userInfo.uid}`);
                }}
              >
                👉 Go to Profile
              </button>
            </div>
          </>
        )}
      </div>
    </HighlightsBar>
  );
};

const UserIcon = () => (
  <svg width="26" height="21" viewBox="0 0 26 21" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M9.25 10.5C7.45312 10.5 5.8125 9.5625 4.91406 8C2.96094 4.67969 5.38281 0.5 9.25 0.5C11.0078 0.5 12.6484 1.47656 13.5469 3C15.5 6.35938 13.0781 10.5 9.25 10.5ZM7.45312 12.375H11.0078C11.2812 12.375 11.5156 12.4141 11.75 12.4141C11.75 12.6094 11.75 12.8047 11.75 13C11.75 16.4766 14.5234 19.25 18 19.25C18 19.2891 18 19.3281 18 19.3672C18 19.9922 17.4531 20.5 16.8281 20.5H1.63281C1.00781 20.5 0.5 19.9922 0.5 19.3672C0.5 15.5 3.58594 12.375 7.45312 12.375ZM18 9.91406C16.8672 9.91406 15.8516 10.5 15.2656 11.4766C14.0547 13.5469 15.5781 16.1641 18 16.1641C19.0938 16.1641 20.1094 15.5391 20.6953 14.6016C21.9062 12.4922 20.3828 9.91406 18 9.91406ZM18 18.0391H17.9609C15.2266 18.0391 12.9609 15.7734 12.9609 13.0391C12.9609 10.2656 15.2266 8.03906 17.9609 8.03906C20.7344 8.03906 22.9609 10.2656 22.9609 13.0391C22.9609 14.0547 22.6484 15.0312 22.1016 15.8516L25.1875 18.9375C25.5781 19.2891 25.5781 19.875 25.1875 20.2656C24.8359 20.6172 24.25 20.6172 23.8984 20.2656L20.7734 17.1406C19.9922 17.6875 19.0156 18.0391 18 18.0391Z"
      fill="white"
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
