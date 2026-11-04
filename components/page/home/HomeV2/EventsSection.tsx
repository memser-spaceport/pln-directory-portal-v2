'use client';

import clsx from 'clsx';
import Link from 'next/link';

import { useHomeAnalytics } from '@/analytics/home.analytics';
import type { IHomeEvent } from '@/types/home.types';
import nc from '@/components/page/home/TeamNews/components/NewsCard/NewsCard.module.scss';
import jobsCss from '@/components/page/jobs/TeamGroupCard/TeamGroupCard.module.scss';
import { ArrowIcon } from '@/components/page/jobs/TeamGroupCard/component/ReferRoleRow/components/Icons';

import { EVENTS_HREF } from './constants';
import { eventDay, eventMonth, eventRange } from './utils/upcomingEvents';
import s from './HomeV2.module.scss';

/**
 * Upcoming events, under the roles in the same rail card and row vocabulary (prototype `EventsRail`,
 * home-refactor/EventsRail.tsx). The team logo slot becomes a date tile, because the date is what decides a click on an
 * event. Renders nothing when there are no events.
 */
export function EventsSection({ events, total, signedIn }: { events: IHomeEvent[]; total: number; signedIn: boolean }) {
  const analytics = useHomeAnalytics();

  if (events.length === 0) return null;

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
          return (
            <li key={ev.uid} className={clsx(s.roleRow, s.jobRow)}>
              <span className={s.dateTile} aria-hidden>
                <span className={s.dateMonth}>{eventMonth(ev.startDate)}</span>
                <span className={s.dateDay}>{eventDay(ev.startDate)}</span>
              </span>
              <span className={s.jobText}>
                <Link
                  href={EVENTS_HREF}
                  className={clsx(s.roleTitle, s.jobTitle, s.eventLink)}
                  onClick={() =>
                    analytics.onEventClicked({ event_uid: ev.uid, position: index + 1, signed_in: signedIn })
                  }
                >
                  {ev.name}
                </Link>
                <span className={s.roleLocation}>
                  {range ? `${range} · ` : ''}
                  {ev.location}
                </span>
              </span>
              <span className={s.roleArrow} aria-hidden>
                <ArrowIcon />
              </span>
            </li>
          );
        })}
      </ul>

      <Link
        href={EVENTS_HREF}
        className={clsx(jobsCss.expander, s.viewAllExpander)}
        onClick={() => analytics.onSeeAllClicked({ section: 'events' })}
      >
        See all {total} events
      </Link>
    </section>
  );
}
