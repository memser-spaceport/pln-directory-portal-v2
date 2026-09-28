'use client';

import clsx from 'clsx';

import { getFormattedDateString } from '@/utils/irl.utils';

// Same shell and type as the rail's "Popular this week" card, so the two read as
// siblings. The footer link is production HiringCard's expander.
import s from '@/components/page/home/TeamNews/components/NewsCard/NewsCard.module.scss';
import hiring from '@/components/page/home/TeamNews/components/HiringCard/HiringCard.module.scss';
import v0 from '../newsfeed-v0/NewsfeedV0.module.scss';
import local from './Newsfeed.module.scss';

import type { UpcomingEvent } from './mocks';

const MAX_EVENTS = 3;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const cityOf = (event: UpcomingEvent) => event.location.split(',')[0].trim();

/**
 * Which three. The card exists to put events in front of people who don't know
 * about them, so:
 *
 *  - Not ones you're already going to. You know about those; a reminder belongs
 *    to notifications and the digest, not to a discovery slot.
 *  - Not invite-only ones you have no invite to. A door you can't open.
 *  - Events in cities you follow get a place first, the soonest fill the rest,
 *    and the three are shown in date order. Following never keeps an event out.
 *
 * Signed out, nobody is going or invited and nothing is followed, so this is
 * simply the next three open events. Fewer than three qualifying shows fewer —
 * never padded with the excluded ones.
 */
export function selectRailEvents(
  events: UpcomingEvent[],
  viewer: { signedIn: boolean; followedCities: readonly string[] },
): UpcomingEvent[] {
  const followed = new Set(viewer.signedIn ? viewer.followedCities : []);
  const eligible = events.filter((event) => {
    if (viewer.signedIn && event.viewerGoing) return false;
    if (event.type === 'INVITE_ONLY' && !(viewer.signedIn && event.viewerInvited)) return false;
    return true;
  });
  // Followed cities decide which three get in; the date decides the order they
  // show in. Ranking a followed city to the top would put Nov above Oct with
  // nothing on the card saying why.
  return eligible
    .map((event, i) => ({ event, i, followed: followed.has(cityOf(event)) }))
    .sort((a, b) => Number(b.followed) - Number(a.followed) || a.i - b.i)
    .slice(0, MAX_EVENTS)
    .sort((a, b) => a.i - b.i)
    .map(({ event }) => event);
}

/** Day and month of the start date, read off the ISO string the way production's
 *  `getFormattedDateString` does, so a timezone can't move an event a day. */
function startDayMonth(iso: string) {
  const [, month, day] = iso.split('T')[0].split('-');
  return { day: parseInt(day, 10), month: MONTHS[parseInt(month, 10) - 1] };
}

interface UpcomingEventsCardProps {
  /** Already chosen by `selectRailEvents`. */
  events: UpcomingEvent[];
}

/**
 * Upcoming events in the rail: a start-date tile, the name, the city and how
 * many are going.
 *
 * Dated events only, never location cards: the old home Featured row's event
 * cards were clicked by 4–5% of monthly home visitors, the city cards that
 * replaced them by about 1%. So the date leads each row as its thumbnail
 * (Circle's rail does the same). The tile carries the start date; the full range
 * is its tooltip and the event page's job. "N going" is the reason to pick one
 * event over another.
 *
 * Rows go where production's Featured event cards went (the IRL page filtered to
 * that location's upcoming events); "View all events" is the door to the index.
 * Renders nothing when nothing qualifies.
 */
export function UpcomingEventsCard({ events }: UpcomingEventsCardProps) {
  if (events.length === 0) return null;

  return (
    <section className={clsx(s.card, v0.railCard)} aria-label="Upcoming events">
      <h3 className={v0.railTitle}>Upcoming events</h3>
      {events.map((event) => {
        const city = cityOf(event);
        const { day, month } = startDayMonth(event.startDate);
        return (
          <a
            key={event.slug}
            className={local.eventRow}
            href={`/events/irl?location=${encodeURIComponent(city)}&type=upcoming`}
          >
            <span className={local.dateTile} title={getFormattedDateString(event.startDate, event.endDate)}>
              <span className={local.dateDay}>{day}</span>
              <span className={local.dateMonth}>{month}</span>
            </span>
            <span className={local.eventText}>
              <span className={clsx(v0.railStoryTitle, local.eventName)}>{event.name}</span>
              <span className={v0.railReason}>
                {city}
                {event.attendees > 0 && ` · ${event.attendees} going`}
              </span>
            </span>
          </a>
        );
      })}
      <a className={hiring.expander} href="/events/irl">
        View all events
      </a>
    </section>
  );
}
