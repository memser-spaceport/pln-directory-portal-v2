'use client';

import React, { useCallback, useState } from 'react';

import s from './SubscribeToRecoomendations.module.scss';
import { useMemberNotificationsSettings } from '@/services/members/hooks/useMemberNotificationsSettings';
import { IUserInfo } from '@/types/shared.types';
import { useUpdateMemberNotificationsSettings } from '@/services/members/hooks/useUpdateMemberNotificationsSettings';
import { useQueryClient } from '@tanstack/react-query';
import { MembersQueryKeys } from '@/services/members/constants';
import { usePathname, useRouter } from 'next/navigation';
import { HighlightsBar } from '@/components/core/navbar/components/HighlightsBar';
import { clsx } from 'clsx';
import { useMember } from '@/services/members/hooks/useMember';
import { useMemberAnalytics } from '@/analytics/members.analytics';

interface Props {
  userInfo: IUserInfo;
}

export const SubscribeToRecoomendations = ({ userInfo }: Props) => {
  const [view, setView] = useState<'initial' | 'confirmation'>('initial');
  const [open, setOpen] = useState(false);
  const { data: member, isLoading } = useMember(userInfo.uid);
  const { data } = useMemberNotificationsSettings(userInfo?.uid);
  const { mutateAsync } = useUpdateMemberNotificationsSettings();
  const queryClient = useQueryClient();
  const pathname = usePathname();
  const router = useRouter();
  const { onSubscribeToRecommendationsClicked, onCloseSubscribeToRecommendationsClicked } = useMemberAnalytics();

  const handleSubscribe = useCallback(async () => {
    if (!userInfo) {
      return;
    }

    const res = await mutateAsync({
      memberUid: userInfo.uid,
      subscribed: true,
    });

    if (res) {
      onSubscribeToRecommendationsClicked('bar');
      setView('confirmation');

      setTimeout(() => {
        queryClient.invalidateQueries({
          queryKey: [MembersQueryKeys.GET_NOTIFICATIONS_SETTINGS],
        });
      }, 15000);
    }
  }, [mutateAsync, onSubscribeToRecommendationsClicked, queryClient, userInfo]);

  const handleClose = useCallback(async () => {
    if (!userInfo) {
      return;
    }

    const res = await mutateAsync({
      memberUid: userInfo.uid,
      showInvitationDialog: false,
    });

    if (res) {
      onCloseSubscribeToRecommendationsClicked('bar');
      queryClient.invalidateQueries({
        queryKey: [MembersQueryKeys.GET_NOTIFICATIONS_SETTINGS],
      });
    }
  }, [mutateAsync, onCloseSubscribeToRecommendationsClicked, queryClient, userInfo]);

  const isProfileFilled = member?.memberInfo.telegramHandler && member?.memberInfo.officeHours && member?.memberInfo.skills.length > 0;

  if (!userInfo || pathname.includes(`/members/${userInfo.uid}`) || !data || data.subscribed || !data.recommendationsEnabled || !data.showInvitationDialog || !isProfileFilled || isLoading) {
    return null;
  }

  return (
    <HighlightsBar>
      <div className={s.root}>
        {view === 'initial' && (
          <>
            <div className={s.left}>
              <BellIcon />
              <span className={s.title}>CONNECT WITH the RIGHT PEOPLE.</span>
              <span className={s.description}>Receive 2x/month email suggestions to meet high-signal peers.</span>
            </div>
            <div className={s.right}>
              <button className={s.btn} onClick={handleClose}>
                Not now
              </button>
              {!open && (
                <button className={clsx(s.btn, s.primary)} onClick={handleSubscribe}>
                  Opt in
                </button>
              )}
            </div>
          </>
        )}
        {view === 'confirmation' && (
          <>
            <div className={s.left}>
              <CheckIcon />
              <span className={s.title}>You opted-in!</span>
              <span className={s.description}>Make sure your profile is as complete as possible to increase the quality of recommended connections.</span>
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
          </>
        )}
      </div>
      <div className={s.mobileDetails}>
        {!open ? (
          <button className={s.control} onClick={() => setOpen(!open)}>
            View More <ChevronDownIcon />
          </button>
        ) : (
          <>
            <div className={s.mobileDescWrapper}>
              {view === 'initial' ? (
                <span className={s.description}>Receive 2x/month email suggestions to meet high-signal peers.</span>
              ) : (
                <span className={s.description}>Make sure your profile is as complete as possible to increase the quality of recommended connections.</span>
              )}
            </div>

            <div className={s.right}>
              <button className={s.btn} onClick={handleClose}>
                Not now
              </button>
              {view === 'initial' ? (
                <button className={clsx(s.btn, s.primary)} onClick={handleSubscribe}>
                  Opt in
                </button>
              ) : (
                <button
                  className={clsx(s.btn, s.primary)}
                  onClick={() => {
                    router.push(`/members/${userInfo.uid}`);
                  }}
                >
                  👉 Go to Profile
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </HighlightsBar>
  );
};

const BellIcon = () => (
  <svg width="18" height="21" viewBox="0 0 18 21" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M9 0.5C9.66406 0.5 10.25 1.08594 10.25 1.75V2.53125C13.1016 3.07812 15.25 5.61719 15.25 8.625V9.36719C15.25 11.2031 15.9141 13 17.125 14.3672L17.3984 14.6797C17.75 15.0703 17.8281 15.5781 17.6328 16.0469C17.4375 16.4766 16.9688 16.75 16.5 16.75H1.5C0.992188 16.75 0.523438 16.4766 0.328125 16.0469C0.132812 15.5781 0.210938 15.0703 0.5625 14.6797L0.835938 14.3672C2.04688 13 2.75 11.2031 2.75 9.36719V8.625C2.75 5.61719 4.89844 3.07812 7.75 2.53125V1.75C7.75 1.08594 8.29688 0.5 9 0.5ZM10.7578 19.7969C10.2891 20.2656 9.66406 20.5 9 20.5C8.33594 20.5 7.67188 20.2656 7.20312 19.7969C6.73438 19.3281 6.5 18.6641 6.5 18H9H11.5C11.5 18.6641 11.2266 19.3281 10.7578 19.7969Z"
      fill="white"
    />
  </svg>
);

const CheckIcon = () => (
  <svg width="22" height="16" viewBox="0 0 22 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M21.0312 0.96875C21.6406 1.53125 21.6406 2.51562 21.0312 3.07812L9.03125 15.0781C8.46875 15.6875 7.48438 15.6875 6.92188 15.0781L0.921875 9.07812C0.3125 8.51562 0.3125 7.53125 0.921875 6.96875C1.48438 6.35938 2.46875 6.35938 3.03125 6.96875L8 11.8906L18.9219 0.96875C19.4844 0.359375 20.4688 0.359375 21.0312 0.96875Z"
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
