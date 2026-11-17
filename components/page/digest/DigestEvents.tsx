'use client';

import clsx from 'clsx';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { useDigestAnalytics } from '@/analytics/digest.analytics';
import { toast } from '@/components/core/ToastContainer';
import { CheckIcon } from '@/components/icons';
import type { EventGoingNotice } from '@/components/page/events/EventDrawer/EventDrawerView';
import { eventGoingToastText } from '@/components/page/events/EventDrawer/toast';
import { EVENTS_HREF } from '@/components/page/home/HomeV2/constants';
import {
  eventCalendarHref,
  eventDay,
  eventMonth,
  eventRange,
} from '@/components/page/home/HomeV2/utils/upcomingEvents';
import { useCurrentUserStore } from '@/services/auth/store';
import type { DigestEvent } from '@/services/digest/digest.types';
import { EventsQueryKeys } from '@/services/events/constants';
import { usePrefetchEventDetail } from '@/services/events/hooks/useEventDrawerQueries';
import { useMyUpcomingEventUids } from '@/services/events/hooks/useMyUpcomingEventUids';
import { SHOW_EVENT_DRAWER } from '@/utils/event-drawer';

import s from './DigestEvents.module.scss';

/** Loaded on the first press (or the hover before it), as on Home, so the page doesn't ship the drawer to everyone. */
const loadEventDrawer = () => import('@/components/page/events/EventDrawer/EventDrawer');
const EventDrawer = dynamic(() => loadEventDrawer().then((m) => m.EventDrawer), { ssr: false });

type Props = {
  events: DigestEvent[];
  /** Window's total, for "See all N events". */
  total: number;
  /** Undefined until the auth store hydrates. */
  signedIn: boolean | undefined;
};

const WEEKDAY = new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone: 'UTC' });

/**
 * "Upcoming events" (LAB-3292, the digest-web prototype's DigestEvents): the next four weeks in the network, one row
 * per event with Home's date tile, the name, when and where, and who's going; the event's logo on the right. As on
 * Home's rail: with the event drawer flag on and a signed-in member a row opens the drawer over the page, otherwise
 * it links to the event in the All Events calendar. Ends on "See all N events".
 */
export function DigestEvents({ events, total, signedIn }: Props) {
  const analytics = useDigestAnalytics();
  const drawerMode = SHOW_EVENT_DRAWER && signedIn === true;
  const { currentUser } = useCurrentUserStore();
  const viewerUid = currentUser?.uid ?? null;
  const queryClient = useQueryClient();
  const { data: goingData } = useMyUpcomingEventUids(drawerMode);
  const goingUids = new Set(Array.isArray(goingData) ? goingData : []);
  const [openUid, setOpenUid] = useState<string | null>(null);
  const prefetchEvent = usePrefetchEventDetail();

  const prepare = (eventUid: string) => {
    void loadEventDrawer();
    prefetchEvent(eventUid);
  };

  const onGoing = (eventUid: string) => (notice: EventGoingNotice) => {
    if (viewerUid) {
      queryClient.setQueryData<string[]>([EventsQueryKeys.MY_UPCOMING_EVENT_UIDS, viewerUid], (old) =>
        Array.from(new Set([...(Array.isArray(old) ? old : []), eventUid])),
      );
    }
    toast.success(eventGoingToastText(notice));
  };

  return (
    <section className={s.section} aria-labelledby="digest-events-title">
      <div className={s.head}>
        <h2 id="digest-events-title" className={s.title}>
          Upcoming events
        </h2>
        <p className={s.subtitle}>The next four weeks in the network</p>
      </div>

      <ul className={s.list}>
        {events.map((event, position) => {
          const going = drawerMode && goingUids.has(event.uid);
          const content = (
            <>
              <span className={s.dateTile} aria-hidden>
                <span className={s.dateMonth}>{eventMonth(event.startDate)}</span>
                <span className={s.dateDay}>{eventDay(event.startDate)}</span>
              </span>
              <span className={s.text}>
                <span className={s.name}>{event.name}</span>
                <span className={s.meta}>{whenAndWhere(event)}</span>
                {going ? (
                  <span className={clsx(s.going, s.goingYou)}>
                    <CheckIcon aria-hidden="true" />
                    You’re going
                  </span>
                ) : (
                  event.goingCount != null &&
                  event.goingCount > 0 && <span className={s.going}>{event.goingCount} going</span>
                )}
              </span>
              {event.logoUrl && (
                <img src={event.logoUrl} alt="" className={s.thumb} width={64} height={64} loading="lazy" />
              )}
            </>
          );
          return (
            <li key={event.uid}>
              {drawerMode ? (
                <button
                  type="button"
                  className={s.row}
                  onPointerEnter={() => prepare(event.uid)}
                  onFocus={() => prepare(event.uid)}
                  onClick={() => {
                    analytics.onEventClicked({ eventUid: event.uid, position, opens: 'drawer' });
                    setOpenUid(event.uid);
                  }}
                >
                  {content}
                </button>
              ) : (
                <Link
                  href={eventCalendarHref(event.name)}
                  className={s.row}
                  onClick={() => analytics.onEventClicked({ eventUid: event.uid, position, opens: 'calendar' })}
                >
                  {content}
                </Link>
              )}
            </li>
          );
        })}
      </ul>

      <Link href={EVENTS_HREF} className={s.seeAll} onClick={() => analytics.onEventsSeeAllClicked({ total })}>
        See all {total} events
      </Link>

      {drawerMode && (
        <EventDrawer
          eventUid={openUid}
          source="digest"
          onClose={() => setOpenUid(null)}
          onGoing={openUid ? onGoing(openUid) : undefined}
        />
      )}
    </section>
  );
}

/** "Thu · Lisbon" for a one-day event, "Nov 3–7 · Lisbon" for a longer one; "Online" for a virtual one. */
function whenAndWhere(event: DigestEvent): string {
  const start = new Date(event.startDate);
  const when =
    eventRange(event.startDate, event.endDate) ?? (Number.isNaN(start.getTime()) ? null : WEEKDAY.format(start));
  const where = event.type === 'VIRTUAL' ? 'Online' : event.location?.split(',')[0].trim() || null;
  return [when, where].filter(Boolean).join(' · ');
}
