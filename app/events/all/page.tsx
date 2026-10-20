import React from 'react';
import { getCookiesFromHeaders } from '@/utils/next-helpers';
import ScheduleSection from '@/components/page/events/schedule-section';
import { EVENTS_LIST_PATH } from '@/utils/constants';
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
  description:
    'Upcoming Protocol Labs network events: join IRL gatherings, conferences and meetups, and connect with teams across the ecosystem.',
  // Its own address: `/events` only redirects here, so naming it as canonical pointed Google at a redirect (LAB-2924).
  path: EVENTS_LIST_PATH,
});
