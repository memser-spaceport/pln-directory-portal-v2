import React from 'react';
import { format } from 'date-fns-tz';

import { useGetDemoDayState } from '@/services/demo-day/hooks/useGetDemoDayState';
import { DemoDayState } from '@/app/actions/demo-day.actions';

import s from './PageTitle.module.scss';

interface PageTitleProps {
  size?: 'small' | 'large';
  initialDemoDayState?: DemoDayState;
}

export function PageTitle(props: PageTitleProps) {
  const { size = 'large', initialDemoDayState } = props;
  const { data: loadedDemoDayData } = useGetDemoDayState(initialDemoDayState);
  const data = loadedDemoDayData || initialDemoDayState;

  return (
    <div className={s.root}>
      <h1 className={`${s.title} ${size === 'small' && s.small}`}>{data?.title || 'PL F25 Demo Day'}</h1>
      <p className={`${s.description} ${size === 'small' && s.small}`}>
        Explore 28 teams across AI, Web3, crypto, robotics, and neurotech. Review teams asynchronously, with direct
        contact available in-platform.
        <br />
        <br />
        <b>Demo Day closes November 6, 2025 @ 5:00 PM PT</b>
      </p>
    </div>
  );
}
