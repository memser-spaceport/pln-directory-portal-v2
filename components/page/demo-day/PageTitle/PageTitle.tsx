import React from 'react';
import { format } from 'date-fns';

import { useGetDemoDayState } from '@/services/demo-day/hooks/useGetDemoDayState';

import s from './PageTitle.module.scss';

export function PageTitle() {
  const { data } = useGetDemoDayState();

  const { date } = data || {};

  return (
    <div className={s.root}>
      <h1 className={s.title}>{data?.title || 'PL F25 Demo Day'}</h1>
      <p className={s.description}>
        An invite-only event for accredited investors, featuring 25 emerging <br />
        <a href="https://www.protocol.ai/" className={s.link}>
          Protocol Labs Network
        </a>{' '}
        teams in rapid-fire demos. <b>{date ? format(date, 'MMMM dd, yyyy') : 'October 23, 2025'}</b>.
      </p>
    </div>
  );
}
