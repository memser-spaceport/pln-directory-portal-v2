import React, { ReactNode } from 'react';
import { Metadata } from 'next';
import { getCookiesFromHeaders } from '@/utils/next-helpers';
import EventsBanner from '@/components/page/events/events-banner';
import HuskyBanner from '@/components/page/events/husky-banner';
import ScheduleSection from '@/components/page/events/schedule-section';
import ScrollObserver from '@/components/page/events/scroll-observer';

import s from './layout.module.css';

export default function Layout({ events, contributors }: { events: ReactNode; contributors: ReactNode }) {
  const { userInfo } = getCookiesFromHeaders();

  return (
    <>
      <div className={s.top}>
        <EventsBanner userInfo={userInfo} />
      </div>
      <div id="events">{events}</div>
      <div className={s.husky}>
        <HuskyBanner userInfo={userInfo} />
      </div>
      <div id="contributors" className={s.contributors}>
        {contributors}
      </div>
      <div id="schedule" className={s.scheduler}>
        <ScheduleSection userInfo={userInfo} />
      </div>
      <ScrollObserver />
    </>
  );
}

export const metadata: Metadata = {
  title: 'Events | Protocol Labs Directory',
  description: 'Explore upcoming events, join IRL gatherings, and connect with teams across the ecosystem.',
};
