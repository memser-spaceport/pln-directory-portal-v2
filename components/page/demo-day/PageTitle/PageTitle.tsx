import React from 'react';
import { format } from 'date-fns';
import Cookies from 'js-cookie';

import { useGetDemoDayState } from '@/services/demo-day/hooks/useGetDemoDayState';
import { useReportAnalyticsEvent, TrackEventDto } from '@/services/demo-day/hooks/useReportAnalyticsEvent';
import { DEMO_DAY_ANALYTICS } from '@/utils/constants';
import { getParsedValue } from '@/utils/common.utils';
import { IUserInfo } from '@/types/shared.types';

import s from './PageTitle.module.scss';

interface PageTitleProps {
  size?: 'small' | 'large';
}

export function PageTitle(props: PageTitleProps) {
  const { size = 'large' } = props;
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
        An invite-only event for accredited investors, featuring 20+ top teams from Pre-Seed to Series A, across the{' '}
        <a
          href="https://www.protocol.ai/"
          className={s.link}
          onClick={handleProtocolLabsLinkClick}
          target="_blank"
          rel="noreferrer"
        >
          Protocol Labs
        </a>{' '}
        network. <br className={s.hideOnMobile} /> <b>{date ? format(date, 'MMMM dd, yyyy') : 'October 23, 2025'}</b>.
      </p>
    </div>
  );
}
