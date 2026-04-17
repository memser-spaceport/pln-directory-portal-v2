'use client';

import React, { useState } from 'react';

import { CloseIcon } from '@/components/icons/CloseIcon';
import { useGetMemberPreferences } from '@/services/members/hooks/useGetMemberPreferences';
import { useUpdateMemberPreferences } from '@/services/members/hooks/useUpdateMemberPreferences';
import { useForumAnalytics } from '@/analytics/forum.analytics';
import { getCookiesFromClient } from '@/utils/third-party.helper';

import s from './ForumIntroBanner.module.scss';

const InfoIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22ZM12 11C12.5523 11 13 11.4477 13 12V16C13 16.5523 12.5523 17 12 17C11.4477 17 11 16.5523 11 16V12C11 11.4477 11.4477 11 12 11ZM12 7C11.4477 7 11 7.44772 11 8C11 8.55228 11.4477 9 12 9C12.5523 9 13 8.55228 13 8C13 7.44772 12.5523 7 12 7Z"
      fill="#0A0C11"
    />
  </svg>
);

export const ForumIntroBanner = () => {
  const { userInfo } = getCookiesFromClient();
  const uid = userInfo?.uid;

  const { data, isLoading, isError } = useGetMemberPreferences(uid);
  const { mutate: updatePreferences } = useUpdateMemberPreferences();
  const analytics = useForumAnalytics();

  const [hasLocallyDismissed, setHasLocallyDismissed] = useState(false);

  if (!uid) return null;
  if (isLoading || !data) return null;
  if (isError) return null;
  if (!data.memberPreferences?.showForumBanner) return null;
  if (hasLocallyDismissed) return null;

  const handleDismiss = () => {
    setHasLocallyDismissed(true);
    analytics.onForumBannerDismissed();
    updatePreferences({
      uid,
      payload: { showForumBanner: false },
    });
  };

  return (
    <div className={s.root} role="status" aria-live="polite">
      <span className={s.iconWrapper} aria-hidden>
        <InfoIcon />
      </span>
      <p className={s.copy}>
        Every member has been individually vetted. Only founders and operators in the PL network can see posts here.
        Speak freely.
      </p>
      <button type="button" className={s.close} aria-label="Dismiss forum intro banner" onClick={handleDismiss}>
        <CloseIcon />
      </button>
    </div>
  );
};
