'use client';

import clsx from 'clsx';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { useHomeAnalytics } from '@/analytics/home.analytics';
import type { IHomeEvent } from '@/types/home.types';
import nc from '@/components/page/home/TeamNews/components/NewsCard/NewsCard.module.scss';
import jobsCss from '@/components/page/jobs/TeamGroupCard/TeamGroupCard.module.scss';
import { ArrowIcon } from '@/components/page/jobs/TeamGroupCard/component/ReferRoleRow/components/Icons';
import { toast } from '@/components/core/ToastContainer';
import { CheckIcon } from '@/components/icons';
import type { EventGoingNotice } from '@/components/page/events/EventDrawer/EventDrawerView';
import { eventGoingToastText } from '@/components/page/events/EventDrawer/toast';
import { useCurrentUserStore } from '@/services/auth/store';
import { EventsQueryKeys } from '@/services/events/constants';
import { usePrefetchEventDetail } from '@/services/events/hooks/useEventDrawerQueries';
import { useMyUpcomingEventUids } from '@/services/events/hooks/useMyUpcomingEventUids';
import { SHOW_EVENT_DRAWER } from '@/utils/event-drawer';

import { EVENTS_HREF } from './constants';
import { eventCalendarHref, eventDay, eventMonth, eventRange } from './utils/upcomingEvents';
import s from './HomeV2.module.scss';

/** Loaded on the first press (or the hover before it), so Home doesn't ship the drawer (calendar, forms) to everyone. */
const loadEventDrawer = () => import('@/components/page/events/EventDrawer/EventDrawer');
const EventDrawer = dynamic(() => loadEventDrawer().then((m) => m.EventDrawer), {
  ssr: false,
});

/**
 * Upcoming events, under the roles in the same rail card and row vocabulary (prototype `EventsRail`,
 * home-refactor/EventsRail.tsx). The team logo slot becomes a date tile, because the date is what decides a click on an
 * event. Renders nothing when there are no events.
 *
 * With the event drawer flag on and a signed-in member (LAB-3220, prototype `member-events-going/HomeEventsRail`), a
 * row opens the event drawer over Home instead of All Events. The row asks nothing itself; once the member is going,
 * its arrow becomes "Going". Signed out, or with the flag off, rows stay links to the calendar.
 */
export function EventsSection({ events, total, signedIn }: { events: IHomeEvent[]; total: number; signedIn: boolean }) {
  const analytics = useHomeAnalytics();
  const drawerMode = SHOW_EVENT_DRAWER && signedIn;

  const { currentUser } = useCurrentUserStore();
  const viewerUid = currentUser?.uid ?? null;
  const queryClient = useQueryClient();
  // A failed or pending request leaves the rail without marks; rows still open the drawer.
  const { data: goingData } = useMyUpcomingEventUids(drawerMode);
  const goingUids = new Set(Array.isArray(goingData) ? goingData : []);

  const [openUid, setOpenUid] = useState<string | null>(null);
  const prefetchEvent = usePrefetchEventDetail();

  if (events.length === 0) return null;

  // Pointing at or focusing a row starts the drawer's code and the event's data, so the press opens it filled.
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
    toast.success(
      <>
        {eventGoingToastText(notice)}
        {notice.showOnProfile && viewerUid && (
          <>
            {' '}
            <Link href={`/members/${viewerUid}`} className={s.toastLink}>
              View profile
            </Link>
          </>
        )}
      </>,
    );
  };

  return (
    <section className={clsx(nc.card, s.railCard)} aria-labelledby="home-events-title">
      <div className={s.railHead}>
        <h2 id="home-events-title" className={s.railTitle}>
          Upcoming events
        </h2>
      </div>

      <ul className={s.roleList}>
        {events.map((ev, index) => {
          const range = eventRange(ev.startDate, ev.endDate);
          const going = drawerMode && goingUids.has(ev.uid);
          const onPress = () =>
            analytics.onEventClicked({ event_uid: ev.uid, position: index + 1, signed_in: signedIn });
          return (
            <li key={ev.uid} className={clsx(s.roleRow, s.jobRow, drawerMode && s.eventRow)}>
              <span className={s.dateTile} aria-hidden>
                <span className={s.dateMonth}>{eventMonth(ev.startDate)}</span>
                <span className={s.dateDay}>{eventDay(ev.startDate)}</span>
              </span>
              <span className={s.jobText}>
                {drawerMode ? (
                  <button
                    type="button"
                    className={clsx(s.roleTitle, s.jobTitle, s.eventLink, s.eventPress)}
                    onPointerEnter={() => prepare(ev.uid)}
                    onFocus={() => prepare(ev.uid)}
                    onClick={() => {
                      onPress();
                      setOpenUid(ev.uid);
                    }}
                  >
                    {ev.name}
                  </button>
                ) : (
                  <Link
                    href={eventCalendarHref(ev.name)}
                    className={clsx(s.roleTitle, s.jobTitle, s.eventLink)}
                    onClick={onPress}
                  >
                    {ev.name}
                  </Link>
                )}
                <span className={s.roleLocation}>
                  {range ? `${range} · ` : ''}
                  {ev.location}
                </span>
              </span>
              {going ? (
                <span className={s.goingMark}>
                  <CheckIcon aria-hidden="true" />
                  Going
                </span>
              ) : (
                <span className={s.roleArrow} aria-hidden>
                  <ArrowIcon />
                </span>
              )}
            </li>
          );
        })}
      </ul>

      <Link
        href={EVENTS_HREF}
        className={clsx(jobsCss.expander, s.viewAllExpander)}
        onClick={() => analytics.onSeeAllClicked({ section: 'events' })}
      >
        See all {total} {total === 1 ? 'event' : 'events'}
      </Link>

      {drawerMode && openUid && (
        <EventDrawer eventUid={openUid} source="home" onClose={() => setOpenUid(null)} onGoing={onGoing(openUid)} />
      )}
    </section>
  );
}
