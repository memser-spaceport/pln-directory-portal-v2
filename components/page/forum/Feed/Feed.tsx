'use client';

import { clsx } from 'clsx';
import React, { useCallback, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { useForumAnalytics } from '@/analytics/forum.analytics';
import { useScrollDirection } from '@/components/core/MobileBottomNav';

import { Posts } from '@/components/page/forum/Posts';
import { ForumHeader } from '@/components/page/forum/ForumHeader';
import { CategoriesTabs } from '@/components/page/forum/CategoriesTabs';
import { ScrollToTopButton } from '@/components/page/forum/ScrollToTopButton';


import s from './Feed.module.scss';

export const Feed = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const cid = searchParams.get('cid') as string;
  const scrollDirection = useScrollDirection();
  const analytics = useForumAnalytics();

  const [bannerDismissed, setBannerDismissed] = useState(true);
  useEffect(() => {
    setBannerDismissed(localStorage.getItem('forum-banner-dismissed') === 'true');
  }, []);

  const dismissBanner = () => {
    setBannerDismissed(true);
    localStorage.setItem('forum-banner-dismissed', 'true');
  };

  const onValueChange = useCallback(
    (value: string) => {
      analytics.onForumTopicClicked({ topicId: value });
      const params = new URLSearchParams(searchParams.toString());
      params.set('cid', value); // or use `params.delete(key)` to remove

      router.push(`?${params.toString()}`, { scroll: false });
    },
    [analytics, router, searchParams],
  );

  return (
    <div className={s.root}>
      {!bannerDismissed && (
        <div className={s.alert}>
          <div className={s.alertContent}>
            <div className={s.alertIcon}>
              <InfoIcon />
            </div>
            <div className={s.alertText}>
              <p>
                Every member has been individually vetted. Only founders and operators in the PL network can see posts here. Speak freely.
              </p>
            </div>
          </div>
          <button className={s.alertClose} onClick={dismissBanner} aria-label="Dismiss">
            <CloseIcon />
          </button>
        </div>
      )}
      <div className={s.stickyHeader}>
        <ForumHeader />
        <CategoriesTabs onValueChange={onValueChange} value={cid} />
      </div>
      <Posts />
      <button
        className={clsx(s.triggerButton, {
          [s.hidden]: scrollDirection === 'down',
        })}
        onClick={() => {
          analytics.onCreatePostClicked();
          router.push('/forum/posts/new');
        }}
      >
        Create post <PlusIcon />
      </button>
      <ScrollToTopButton />
    </div>
  );
};

const InfoIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path
      d="M10 0.25C8.07164 0.25 6.18657 0.821828 4.58319 1.89317C2.97982 2.96451 1.73013 4.48726 0.992179 6.26884C0.254225 8.05042 0.061142 10.0108 0.437348 11.9021C0.813554 13.7934 1.74215 15.5307 3.10571 16.8943C4.46928 18.2579 6.20656 19.1865 8.09787 19.5627C9.98919 19.9389 11.9496 19.7458 13.7312 19.0078C15.5127 18.2699 17.0355 17.0202 18.1068 15.4168C19.1782 13.8134 19.75 11.9284 19.75 10C19.7473 7.41498 18.7192 4.93661 16.8913 3.10872C15.0634 1.28084 12.585 0.25273 10 0.25ZM9.625 4.75C9.84751 4.75 10.065 4.81598 10.25 4.9396C10.435 5.06321 10.5792 5.23891 10.6644 5.44448C10.7495 5.65005 10.7718 5.87625 10.7284 6.09448C10.685 6.31271 10.5778 6.51316 10.4205 6.6705C10.2632 6.82783 10.0627 6.93498 9.84448 6.97838C9.62625 7.02179 9.40005 6.99951 9.19449 6.91436C8.98892 6.82922 8.81322 6.68502 8.6896 6.50002C8.56598 6.31501 8.5 6.0975 8.5 5.875C8.5 5.57663 8.61853 5.29048 8.82951 5.0795C9.04049 4.86853 9.32664 4.75 9.625 4.75ZM10.75 15.25C10.3522 15.25 9.97065 15.092 9.68934 14.8107C9.40804 14.5294 9.25 14.1478 9.25 13.75V10C9.05109 10 8.86033 9.92098 8.71967 9.78033C8.57902 9.63968 8.5 9.44891 8.5 9.25C8.5 9.05109 8.57902 8.86032 8.71967 8.71967C8.86033 8.57902 9.05109 8.5 9.25 8.5C9.64783 8.5 10.0294 8.65804 10.3107 8.93934C10.592 9.22064 10.75 9.60218 10.75 10V13.75C10.9489 13.75 11.1397 13.829 11.2803 13.9697C11.421 14.1103 11.5 14.3011 11.5 14.5C11.5 14.6989 11.421 14.8897 11.2803 15.0303C11.1397 15.171 10.9489 15.25 10.75 15.25Z"
      fill="#0A0C11"
    />
  </svg>
);

const CloseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 256 256" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z"
      fill="#455468"
    />
  </svg>
);

const PlusIcon = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M18.0312 10C18.0312 10.2238 17.9424 10.4384 17.7841 10.5966C17.6259 10.7549 17.4113 10.8438 17.1875 10.8438H11.8438V16.1875C11.8438 16.4113 11.7549 16.6259 11.5966 16.7841C11.4384 16.9424 11.2238 17.0312 11 17.0312C10.7762 17.0312 10.5616 16.9424 10.4034 16.7841C10.2451 16.6259 10.1562 16.4113 10.1562 16.1875V10.8438H4.8125C4.58872 10.8438 4.37411 10.7549 4.21588 10.5966C4.05764 10.4384 3.96875 10.2238 3.96875 10C3.96875 9.77622 4.05764 9.56161 4.21588 9.40338C4.37411 9.24514 4.58872 9.15625 4.8125 9.15625H10.1562V3.8125C10.1562 3.58872 10.2451 3.37411 10.4034 3.21588C10.5616 3.05764 10.7762 2.96875 11 2.96875C11.2238 2.96875 11.4384 3.05764 11.5966 3.21588C11.7549 3.37411 11.8438 3.58872 11.8438 3.8125V9.15625H17.1875C17.4113 9.15625 17.6259 9.24514 17.7841 9.40338C17.9424 9.56161 18.0312 9.77622 18.0312 10Z"
      fill="white"
    />
  </svg>
);
