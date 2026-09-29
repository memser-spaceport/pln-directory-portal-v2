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
/** How far ahead the card looks. Nothing starting inside it → no card at all. */
export const EVENTS_WINDOW_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const cityOf = (event: UpcomingEvent) => event.location.split(',')[0].trim();

/**
 * Which three. The card exists to put events in front of people who don't know
 * about them, so:
 *
 *  - Only ones starting in the next 30 days (`EVENTS_WINDOW_DAYS`), and not
 *    ones already over. A gathering two months out isn't something to act on
 *    from the home rail, and with nothing inside the window the card doesn't
 *    render — no empty state, because an empty card still takes the rail's
 *    second slot.
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
  now: Date = new Date(),
): UpcomingEvent[] {
  const followed = new Set(viewer.signedIn ? viewer.followedCities : []);
  const horizon = now.getTime() + EVENTS_WINDOW_DAYS * DAY_MS;
  const eligible = events.filter((event) => {
    if (new Date(event.endDate).getTime() < now.getTime()) return false;
    if (new Date(event.startDate).getTime() > horizon) return false;
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
 * Upcoming events in the rail: a start-date tile, the name and the city, each
 * row a link. A passive block — nothing to RSVP or dismiss here.
 *
 * Dated events only, never location cards: the old home Featured row's event
 * cards were clicked by 4–5% of monthly home visitors, the city cards that
 * replaced them by about 1%. So the date leads each row as its thumbnail
 * (Circle's rail does the same). The tile carries the start date; the full range
 * is its tooltip and the event page's job. No "N going": production has no
 * attendee count worth showing (LAB-2689), so the row doesn't invent one.
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
              <span className={v0.railReason}>{city}</span>
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
