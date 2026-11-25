import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { AllEventsPage } from '@/components/page/events/all-events/AllEventsPage';
import { getAllEventsPageEvents } from '@/services/events/all-events.service';
import { EMBED_DETAILS_ON_LABOS, EMBED_DETAILS_PARAM, localIso } from '@/services/events/all-events.filters';
import { SHOW_EVENTS_PAGE_V2 } from '@/utils/events-page';

/**
 * `/events/embed` (LAB-3352): the All Events view alone, for another site to frame (the plrd.org focus area
 * pages, which framed the old events calendar). Its address carries the view and the filters, as the page's own does;
 * the Embed button on `/events/all` copies it. An event opens its drawer in the embed, or with `details=labos` opens
 * LabOS in a new tab (LAB-3392). Read signed out, whoever opens it: a framed page often gets no
 * LabOS cookies, and nothing on it is the reader's own. Any https site may frame it (`utils/security-headers.js`).
 */
export default async function EventsEmbedRoute({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  // The native page is the embed: without it there is nothing to frame.
  if (!SHOW_EVENTS_PAGE_V2) notFound();

  const [result, query] = await Promise.all([getAllEventsPageEvents(), searchParams]);
  const now = new Date();
  return (
    <AllEventsPage
      embed
      detailsOnLabOs={query[EMBED_DETAILS_PARAM] === EMBED_DETAILS_ON_LABOS}
      result={result}
      signedIn={false}
      viewerUid={null}
      memberCity={undefined}
      serverNow={now.getTime()}
      serverTodayIso={localIso(now)}
      submitHref=""
    />
  );
}

export const metadata: Metadata = {
  title: 'Events | Protocol Labs',
  // A copy of `/events/all` for frames: search engines index that page, not this one.
  robots: { index: false, follow: true },
};
