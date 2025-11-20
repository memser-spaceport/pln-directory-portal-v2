import React from 'react';
import { format } from 'date-fns-tz';

import { useGetDemoDayState } from '@/services/demo-day/hooks/useGetDemoDayState';
import { DemoDayState } from '@/app/actions/demo-day.actions';

import s from './PageTitle.module.scss';

interface PageTitleProps {
  size?: 'small' | 'large';
  initialDemoDayState?: DemoDayState;
  subtitle?: React.ReactNode;
}

export function PageTitle(props: PageTitleProps) {
  const { size = 'large', initialDemoDayState, subtitle = '' } = props;
  const { data: loadedDemoDayData } = useGetDemoDayState(initialDemoDayState);
  const data = loadedDemoDayData || initialDemoDayState;

  return (
    <div className={s.root}>
      <h1 className={`${s.title} ${size === 'small' && s.small}`}>{data?.title || 'PL F25 Demo Day'}</h1>
      <p className={`${s.description} ${size === 'small' && s.small}`}>
        Explore 28 teams across AI, Web3, crypto, robotics, and neurotech.
        <br />
        Review teams asynchronously, with direct contact available in-platform.
        <br />
        {subtitle}
        <br />
        <b>F25 Demo Day closed on Nov 7th at 10:00 PM PST</b>
      </p>
    </div>
  );
}
