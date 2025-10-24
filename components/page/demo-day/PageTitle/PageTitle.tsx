import React from 'react';
import { format } from 'date-fns-tz';

import { useGetDemoDayState } from '@/services/demo-day/hooks/useGetDemoDayState';
import { DemoDayState } from '@/app/actions/demo-day.actions';

import s from './PageTitle.module.scss';

interface PageTitleProps {
  size?: 'small' | 'large';
  showDate?: boolean;
  initialDemoDayState?: DemoDayState;
}

export function PageTitle(props: PageTitleProps) {
  const { size = 'large', showDate = true, initialDemoDayState } = props;
  const { data: loadedDemoDayData } = useGetDemoDayState(initialDemoDayState);
  const data = initialDemoDayState || loadedDemoDayData;

  const { date } = data || {};

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
