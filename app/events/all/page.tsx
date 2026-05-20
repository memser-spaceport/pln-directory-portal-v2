import React from 'react';
import { Metadata } from 'next';
import { getCookiesFromHeaders } from '@/utils/next-helpers';
import ScheduleSection from '@/components/page/events/schedule-section';

import s from './page.module.css';

export default async function Page() {
  const { userInfo } = await getCookiesFromHeaders();

  return (
    <div id="schedule" className={s.scheduler}>
      <ScheduleSection userInfo={userInfo} />
    </div>
  );
}

export const metadata: Metadata = {
  title: 'Events | Protocol Labs Directory',
  description: 'Explore upcoming events, join IRL gatherings, and connect with teams across the ecosystem.',
};
