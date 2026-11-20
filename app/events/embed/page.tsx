import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { AllEventsPage } from '@/components/page/events/all-events/AllEventsPage';
import { getAllEventsPageEvents } from '@/services/events/all-events.service';
import { localIso } from '@/services/events/all-events.filters';
import { SHOW_EVENTS_PAGE_V2 } from '@/utils/events-page';

/**
 * `/events/embed` (LAB-3352): the All Events view alone, for another site to frame (the plrd.org focus area
 * pages, which framed the old events calendar). Its address carries the view and the filters, as the page's own does;
 * the Embed button on `/events/all` copies it. Read signed out, whoever opens it: a framed page often gets no
 * LabOS cookies, and nothing on it is the reader's own. Any https site may frame it (`utils/security-headers.js`).
 */
export default async function EventsEmbedRoute() {
  // The native page is the embed: without it there is nothing to frame.
  if (!SHOW_EVENTS_PAGE_V2) notFound();

  const result = await getAllEventsPageEvents();
  return (
    <AllEventsPage
      embed
      result={result}
      signedIn={false}
      viewerUid={null}
      memberCity={undefined}
      serverTodayIso={localIso(new Date())}
      submitHref=""
      eventsAppHref=""
    />
  );
}

export const metadata: Metadata = {
  title: 'Events | Protocol Labs',
  // A copy of `/events/all` for frames: search engines index that page, not this one.
  robots: { index: false, follow: true },
};
