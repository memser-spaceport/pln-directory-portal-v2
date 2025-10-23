import React from 'react';
import { format } from 'date-fns-tz';
import Cookies from 'js-cookie';

import { useGetDemoDayState } from '@/services/demo-day/hooks/useGetDemoDayState';
import { useReportAnalyticsEvent, TrackEventDto } from '@/services/demo-day/hooks/useReportAnalyticsEvent';
import { DEMO_DAY_ANALYTICS } from '@/utils/constants';
import { getParsedValue } from '@/utils/common.utils';
import { IUserInfo } from '@/types/shared.types';

import s from './PageTitle.module.scss';

interface PageTitleProps {
  size?: 'small' | 'large';
  showDate?: boolean;
}

export function PageTitle(props: PageTitleProps) {
  const { size = 'large', showDate = true } = props;
  const { data } = useGetDemoDayState();
  const reportAnalytics = useReportAnalyticsEvent();
  const userInfo: IUserInfo = getParsedValue(Cookies.get('userInfo'));

  const { date } = data || {};

  const handleProtocolLabsLinkClick = () => {
    // Custom analytics event
    const protocolLabsLinkEvent: TrackEventDto = {
      name: DEMO_DAY_ANALYTICS.ON_PROTOCOL_LABS_LINK_CLICKED,
      distinctId: userInfo?.email || 'anonymous',
      properties: {
        userId: userInfo?.uid || null,
        userEmail: userInfo?.email || null,
        userName: userInfo?.name || null,
        path: window.location.pathname,
        timestamp: new Date().toISOString(),
        demoDayTitle: data?.title,
        targetUrl: 'https://www.protocol.ai/',
      },
    };

    reportAnalytics.mutate(protocolLabsLinkEvent);
  };

  return (
    <div className={s.root}>
      <h1 className={`${s.title} ${size === 'small' && s.small}`}>{data?.title || 'PL F25 Demo Day'}</h1>
      <p className={`${s.description} ${size === 'small' && s.small}`}>
        Featuring 28 teams from Pre-Seed to Series A+ across AI, web3, crypto, robotics, and neurotech.
        <br />
        <br />
        This is an Invite-only virtual event. The experience is asynchronous and efficient, so you can review quickly
        and at your convenience.
        <br />
        {showDate && (
          <b>Demo Day opens on {date ? format(date, 'dd MMM yyyy, hh:mm aa (zzz)') : 'October 23, 2025'}.</b>
        )}
      </p>
    </div>
  );
}
