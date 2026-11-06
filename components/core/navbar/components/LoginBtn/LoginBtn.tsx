'use client';
import { PropsWithChildren } from 'react';

import { useAuthAnalytics } from '@/analytics/auth.analytics';
import { useDemoDayAnalytics } from '@/analytics/demoday.analytics';
import { TOAST_MESSAGES, DEMO_DAY_ANALYTICS } from '@/utils/constants';
import { useRouter, usePathname } from 'next/navigation';
import { toast } from '@/components/core/ToastContainer';
import { useReportAnalyticsEvent, TrackEventDto } from '@/services/demo-day/hooks/useReportAnalyticsEvent';
import { useCurrentUserStore } from '@/services/auth/store';

import { isDemoDayScopePage, useLoginRedirect } from '../../../login/utils';
import { prefetchPrivyLayer } from '../../../login/components/PrivyLayer/prefetch';

import s from './LoginButton.module.scss';

interface Props {
  className?: string;
  onClick?: () => void;
}

export const LoginBtn = (props: PropsWithChildren<Props>) => {
  const { className, children, onClick } = props;

  const authAnalytics = useAuthAnalytics();
  const demoDayAnalytics = useDemoDayAnalytics();
  const reportAnalytics = useReportAnalyticsEvent();
  const router = useRouter();
  const pathname = usePathname();
  const goToLogin = useLoginRedirect();

  const onLoginClickHandler = () => {
    onClick?.();
    authAnalytics.onLoginBtnClicked();

    // Track demo day login button click if on demo day page
    if (isDemoDayScopePage(pathname, true)) {
      const userInfo = useCurrentUserStore.getState().currentUser;

      // PostHog analytics
      demoDayAnalytics.onLandingLoginButtonClicked();

      // Custom analytics event
      const loginButtonEvent: TrackEventDto = {
        name: DEMO_DAY_ANALYTICS.ON_LANDING_LOGIN_BUTTON_CLICKED,
        distinctId: userInfo?.email || 'anonymous',
        properties: {
          userId: userInfo?.uid || null,
          userEmail: userInfo?.email || null,
          userName: userInfo?.name || null,
          path: '/demoday',
          timestamp: new Date().toISOString(),
          source: 'header',
        },
      };

      reportAnalytics.mutate(loginButtonEvent);
    }

    const userInfo = useCurrentUserStore.getState().currentUser;
    if (userInfo) {
      toast.info(TOAST_MESSAGES.LOGGED_IN_MSG);
      router.refresh();
    } else {
      goToLogin();
    }
  };

  return (
    <>
      {/* Hover, focus or touch start loading the sign-in system, so the dialog doesn't wait on it (LAB-3092). */}
      <button
        className={className || s.root}
        onClick={onLoginClickHandler}
        onMouseEnter={prefetchPrivyLayer}
        onFocus={prefetchPrivyLayer}
        onTouchStart={prefetchPrivyLayer}
      >
        {children || 'Sign in'}
      </button>
    </>
  );
};
