'use client';

import clsx from 'clsx';

import s from '@/components/page/home/TeamNews/components/NewsCard/NewsCard.module.scss';
import jobsCss from '@/components/page/jobs/TeamGroupCard/TeamGroupCard.module.scss';
import { ArrowIcon } from '@/components/page/jobs/TeamGroupCard/component/ReferRoleRow/components/Icons';
import v0 from '../newsfeed-v0/NewsfeedV0.module.scss';
import feed from '../newsfeed/Newsfeed.module.scss';
import local from './HomeRefactorPrototype.module.scss';

import type { HomeEvent } from './mocks';

const EVENTS = '/events/irl';

const month = (iso: string) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
const day = (iso: string) => new Date(`${iso}T12:00:00`).getDate();

/**
 * Upcoming events, stacked under JobsRail in the same rail card and row
 * vocabulary (`feed.roleRow` / `.roleTitle` / `.roleLocation` / `.roleArrow`).
 * The team logo slot becomes a date tile, because the date is what decides a
 * click on an event.
 */
export function EventsRail({ events, total }: { events: HomeEvent[]; total: number }) {
  return (
    <section className={clsx(s.card, v0.railCard)} aria-labelledby="home-events-title">
      <div className={local.railHead}>
        <h2 id="home-events-title" className={v0.railTitle}>
          Upcoming events
        </h2>
      </div>

      <ul className={feed.roleList}>
        {events.map((ev) => (
          <li key={ev.uid} className={clsx(feed.roleRow, local.jobRow)}>
            <span className={local.dateTile} aria-hidden>
              <span className={local.dateMonth}>{month(ev.startDate)}</span>
              <span className={local.dateDay}>{day(ev.startDate)}</span>
            </span>
            <span className={local.jobText}>
              <a href={EVENTS} className={clsx(feed.roleTitle, local.jobTitle, local.eventLink)}>
                {ev.name}
              </a>
              <span className={feed.roleLocation}>
                {ev.range ? `${ev.range} · ` : ''}
                {ev.location} · {ev.host}
              </span>
            </span>
            <span className={feed.roleArrow} aria-hidden>
              <ArrowIcon />
            </span>
          </li>
        ))}
      </ul>

      <a href={EVENTS} className={clsx(jobsCss.expander, v0.viewAllExpander)}>
        See all {total} events
      </a>
    </section>
  );
}
