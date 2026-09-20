import React from 'react';
import { getCookiesFromHeaders } from '@/utils/next-helpers';
import ScheduleSection from '@/components/page/events/schedule-section';
import { PAGE_ROUTES } from '@/utils/constants';
import { listingPageMetadata } from '@/utils/seo';

import s from './page.module.css';

export default async function Page() {
  const { userInfo } = await getCookiesFromHeaders();

  return (
    <div id="schedule" className={s.scheduler}>
      <ScheduleSection userInfo={userInfo} />
    </div>
  );
}

export const metadata = listingPageMetadata({
  title: 'Events | Protocol Labs Directory',
  description: 'Explore upcoming events, join IRL gatherings, and connect with teams across the ecosystem.',
  path: PAGE_ROUTES.EVENTS,
});
