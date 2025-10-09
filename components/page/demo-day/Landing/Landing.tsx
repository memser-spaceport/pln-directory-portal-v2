import React from 'react';
import { clsx } from 'clsx';
import Cookies from 'js-cookie';

import { INVITE_FORM_URL } from '@/constants/demoDay';
import { DEMO_DAY_ANALYTICS } from '@/utils/constants';

import { getParsedValue } from '@/utils/common.utils';

import { useGetDemoDayState } from '@/services/demo-day/hooks/useGetDemoDayState';

import LoginBtn from '@/components/core/navbar/login-btn';
import { LandingBase } from '@/components/page/demo-day/LandingBase';
import { useDemoDayPageViewAnalytics } from '@/hooks/usePageViewAnalytics';
import { useDemoDayAnalytics } from '@/analytics/demoday.analytics';
import { useReportAnalyticsEvent, TrackEventDto } from '@/services/demo-day/hooks/useReportAnalyticsEvent';
import { IUserInfo } from '@/types/shared.types';
import { useTimeOnPage } from '@/hooks/useTimeOnPage';

import s from './Landing.module.scss';


export function Landing() {
  const { data } = useGetDemoDayState();
  const userInfo: IUserInfo = getParsedValue(Cookies.get('userInfo'));

  // Analytics hooks
  const { onLandingRequestInviteButtonClicked } = useDemoDayAnalytics();
  const reportAnalytics = useReportAnalyticsEvent();

  // Page view analytics - triggers only once on mount
  useDemoDayPageViewAnalytics('onLandingPageOpened', DEMO_DAY_ANALYTICS.ON_LANDING_PAGE_OPENED, '/demoday', {
    demoDayTitle: data?.title,
    demoDayDate: data?.date,
    demoDayStatus: data?.status,
    isLoggedIn: !!userInfo,
  });

  // Time on page tracking (analytics/track only, no PostHog)
  useTimeOnPage({
    onTimeReport: (timeSpent, sessionId) => {
      // Custom analytics event only (no PostHog)
      const timeOnPageEvent: TrackEventDto = {
        name: DEMO_DAY_ANALYTICS.ON_LANDING_TIME_ON_PAGE,
        distinctId: userInfo?.email || 'anonymous',
        properties: {
          userId: userInfo?.uid || null,
          userEmail: userInfo?.email || null,
          userName: userInfo?.name || null,
          path: '/demoday',
          timestamp: new Date().toISOString(),
          timeSpent: timeSpent,
          eventId: sessionId,
          demoDayTitle: data?.title,
          isLoggedIn: !!userInfo,
        },
      };

      reportAnalytics.mutate(timeOnPageEvent);
    },
    reportInterval: 30000, // Report every 30 seconds
  });

  const handleRequestInviteClick = () => {
    // PostHog analytics
    onLandingRequestInviteButtonClicked();

    // Custom analytics event
    const requestInviteEvent: TrackEventDto = {
      name: DEMO_DAY_ANALYTICS.ON_LANDING_REQUEST_INVITE_BUTTON_CLICKED,
      distinctId: userInfo?.email || 'anonymous',
      properties: {
        userId: userInfo?.uid || null,
        userEmail: userInfo?.email || null,
        userName: userInfo?.name || null,
        path: '/demoday',
        timestamp: new Date().toISOString(),
        demoDayTitle: data?.title,
        isLoggedIn: !!userInfo,
      },
    };

    reportAnalytics.mutate(requestInviteEvent);
  };

  return (
    <LandingBase>
      <div className={s.root}>
        {!userInfo && <LoginBtn className={clsx(s.btn, s.loginButton)}>Already Approved? Log In</LoginBtn>}

        <a
          href={INVITE_FORM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={s.link}
          onClick={handleRequestInviteClick}
        >
          <button className={clsx(s.btn, s.primaryButton)}>Request to Join</button>
        </a>
      </div>
    </LandingBase>
  );
}
