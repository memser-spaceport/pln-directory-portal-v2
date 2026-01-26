import React from 'react';
import { Metadata } from 'next';
import { getCookiesFromHeaders } from '@/utils/next-helpers';
import ScheduleSection from '@/components/page/events/schedule-section';
import { BackButton } from '@/components/ui/BackButton';
import { PAGE_ROUTES } from '@/utils/constants';

import s from './page.module.css';

export default function Page() {
  const { userInfo } = getCookiesFromHeaders();

  return (
    <div id="schedule" className={s.scheduler}>
      <BackButton to={PAGE_ROUTES.MEMBERS} />
      <ScheduleSection userInfo={userInfo} />
    </div>
  );
}

export const metadata: Metadata = {
  title: 'Events | Protocol Labs Directory',
  description: 'Explore upcoming events, join IRL gatherings, and connect with teams across the ecosystem.',
};
