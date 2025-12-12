'use client';

import { useAuthAnalytics } from '@/analytics/auth.analytics';
import { useDemoDayAnalytics } from '@/analytics/demoday.analytics';
import { TOAST_MESSAGES, DEMO_DAY_ANALYTICS } from '@/utils/constants';
import Cookies from 'js-cookie';
import { useRouter, usePathname } from 'next/navigation';
import { toast } from '@/components/core/ToastContainer';
import { useReportAnalyticsEvent, TrackEventDto } from '@/services/demo-day/hooks/useReportAnalyticsEvent';
import { getParsedValue } from '@/utils/common.utils';
import { IUserInfo } from '@/types/shared.types';

import s from './LoginButton.module.scss';
import { PropsWithChildren } from 'react';
import { isDemoDayScopePage } from '../login/utils';

interface Props {
  className?: string;
}

const LoginBtn = (props: PropsWithChildren<Props>) => {
  const { className, children } = props;

  const authAnalytics = useAuthAnalytics();
  const demoDayAnalytics = useDemoDayAnalytics();
  const reportAnalytics = useReportAnalyticsEvent();
  const router = useRouter();
  const pathname = usePathname();

  const onLoginClickHandler = () => {
    authAnalytics.onLoginBtnClicked();

    // Track demo day login button click if on demo day page
    if (isDemoDayScopePage(pathname, true)) {
      const userInfo: IUserInfo = getParsedValue(Cookies.get('userInfo'));

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

    const userInfo = Cookies.get('userInfo');
    if (userInfo) {
      toast.info(TOAST_MESSAGES.LOGGED_IN_MSG);
      router.refresh();
    } else {
      if (window.location.pathname === '/sign-up') {
        router.push(`/#login`);
      } else {
        router.push(`${window.location.pathname}${window.location.search}#login`);
      }
    }
  };

  return (
    <>
      <button className={className || s.root} onClick={onLoginClickHandler}>
        {children || 'Sign in'}
      </button>
    </>
  );
};

export default LoginBtn;
