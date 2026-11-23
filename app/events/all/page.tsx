import React from 'react';
import { getCookiesFromHeaders } from '@/utils/next-helpers';
import ScheduleSection from '@/components/page/events/schedule-section';
import { AllEventsPage } from '@/components/page/events/all-events/AllEventsPage';
import { getAllEventsPageEvents, getMemberProfileCity } from '@/services/events/all-events.service';
import { localIso } from '@/services/events/all-events.filters';
import { EVENTS_LIST_PATH } from '@/utils/constants';
import { SHOW_EVENT_DRAWER } from '@/utils/event-drawer';
import { SHOW_EVENTS_PAGE_V2 } from '@/utils/events-page';
import { getSubmitEventUrl } from '@/utils/irl-submit-url';
import { listingPageMetadata } from '@/utils/seo';

import s from './page.module.css';

export default async function Page() {
  const { userInfo, authToken } = await getCookiesFromHeaders();

  // The native page (LAB-3247) needs the event drawer: every event opens it. Either flag off keeps the iframe.
  if (!SHOW_EVENTS_PAGE_V2 || !SHOW_EVENT_DRAWER) {
    return (
      <div id="schedule" className={s.scheduler}>
        <ScheduleSection userInfo={userInfo} />
      </div>
    );
  }

  const viewerUid: string | null = userInfo?.uid ?? null;
  const signedIn = !!viewerUid && !!authToken;
  const [result, memberCity] = await Promise.all([
    getAllEventsPageEvents(),
    signedIn ? getMemberProfileCity(viewerUid as string, authToken) : Promise.resolve(undefined),
  ]);

  return (
    <AllEventsPage
      result={result}
      signedIn={signedIn}
      viewerUid={viewerUid}
      memberCity={memberCity}
      serverTodayIso={localIso(new Date())}
      submitHref={getSubmitEventUrl()}
      eventsAppHref={`${process.env.PL_EVENTS_BASE_URL}/calendar`}
    />
  );
}

export const metadata = listingPageMetadata({
  title: 'Events | Protocol Labs Directory',
  description:
    'Upcoming Protocol Labs network events: join IRL gatherings, conferences and meetups, and connect with teams across the ecosystem.',
  // Its own address: `/events` only redirects here, so naming it as canonical pointed Google at a redirect (LAB-2924).
  path: EVENTS_LIST_PATH,
});
