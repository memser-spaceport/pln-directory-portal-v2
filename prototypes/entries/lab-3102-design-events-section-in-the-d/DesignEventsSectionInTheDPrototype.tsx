'use client';

import { useState } from 'react';
import clsx from 'clsx';

import { DIGEST, MATCHED_EVENTS, MAX_EVENTS, type DigestEvent } from './mocks';
import s from './DesignEventsSectionInTheDPrototype.module.scss';

type EventsState = 'three' | 'one' | 'none';
type Width = 'desktop' | 'mobile';

const EVENT_STATES: { value: EventsState; label: string }[] = [
  { value: 'three', label: '3 events' },
  { value: 'one', label: '1 event' },
  { value: 'none', label: 'No match' },
];

const WIDTHS: { value: Width; label: string }[] = [
  { value: 'desktop', label: 'Desktop (600 px)' },
  { value: 'mobile', label: 'Mobile (375 px)' },
];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Day and month read off the ISO string, like production's `getFormattedDateString`, so a timezone cannot move a day. */
function dayMonth(iso: string) {
  const [, month, day] = iso.split('T')[0].split('-');
  return { day: parseInt(day, 10), month: MONTHS[parseInt(month, 10) - 1] };
}

/** "Nov 9", "Nov 9-10" or "Nov 30 - Dec 2": the same shape as the events pages, without the year. */
function dateRange(startIso: string, endIso: string) {
  const start = dayMonth(startIso);
  const end = dayMonth(endIso);
  if (startIso.split('T')[0] === endIso.split('T')[0]) return `${start.month} ${start.day}`;
  if (start.month === end.month) return `${start.month} ${start.day}-${end.day}`;
  return `${start.month} ${start.day} - ${end.month} ${end.day}`;
}

/** "Singapore, Singapore" reads as a mistake in an email: show a city-state once. */
function placeOf(location: string) {
  const [city, country] = location.split(',').map((part) => part.trim());
  return country && country !== city ? `${city}, ${country}` : city;
}

function eventsFor(state: EventsState): DigestEvent[] {
  if (state === 'none') return [];
  return MATCHED_EVENTS.slice(0, state === 'one' ? 1 : MAX_EVENTS);
}

/**
 * The events section of the digest email. It renders nothing when no event
 * matches: no title, no empty text, no blank space.
 *
 * Email-safe on purpose: one column, a fixed 48 px date tile, plain text links,
 * no hover-only state and no image. The email code can build it as a table.
 */
function EventsSection({ events }: { events: DigestEvent[] }) {
  if (events.length === 0) return null;

  return (
    <section className={clsx(s.section, s.eventsSection)} aria-label="Upcoming events for you">
      <h2 className={s.sectionTitle}>Upcoming events for you</h2>
      <ul className={s.eventList}>
        {events.map((event) => {
          const { day, month } = dayMonth(event.startDate);
          const city = event.location.split(',')[0].trim();
          return (
            <li key={event.slug} className={s.eventCard}>
              <span className={s.dateTile} aria-hidden="true">
                <span className={s.dateMonth}>{month}</span>
                <span className={s.dateDay}>{day}</span>
              </span>
              <span className={s.eventBody}>
                <a className={s.eventName} href={`/events/irl?location=${encodeURIComponent(city)}&type=upcoming`}>
                  {event.name}
                </a>
                <span className={s.eventMeta}>
                  {dateRange(event.startDate, event.endDate)} · {placeOf(event.location)}
                </span>
                <a className={s.eventLink} href={`/events/irl?location=${encodeURIComponent(city)}&type=upcoming`}>
                  View event →
                </a>
              </span>
            </li>
          );
        })}
      </ul>
      <a className={s.sectionLink} href="/events/irl">
        See all upcoming events
      </a>
    </section>
  );
}

function Switch<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className={s.switchGroup} role="group" aria-label={label}>
      <span className={s.switchLabel}>{label}</span>
      <div className={s.switch}>
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            className={clsx(s.switchBtn, value === o.value && s.switchBtnActive)}
            aria-pressed={value === o.value}
            onClick={() => onChange(o.value)}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function DesignEventsSectionInTheDPrototype() {
  const [state, setState] = useState<EventsState>('three');
  const [width, setWidth] = useState<Width>('desktop');
  const events = eventsFor(state);
  const weekOf = new Date(DIGEST.weekOf).toLocaleDateString('en-US', { month: 'long', day: 'numeric' });

  return (
    <div className={s.root}>
      <header className={s.header}>
        <h1 className={s.title}>Digest email: upcoming events section</h1>
        <p className={s.description}>
          A first draft for LAB-3102. The section shows at most 3 upcoming events that match the member. It sits after
          the news and before hiring. When no event matches, the section does not show. All data is mock data.
        </p>
        <div className={s.toolbar}>
          <Switch label="Events" options={EVENT_STATES} value={state} onChange={setState} />
          <Switch label="Width" options={WIDTHS} value={width} onChange={setWidth} />
        </div>
        {state === 'none' && (
          <p className={s.stateNote}>No event matches this member, so the email has no events section.</p>
        )}
      </header>

      <div className={clsx(s.stage, width === 'mobile' && s.stageMobile)}>
        <div className={s.clientBar}>
          <div className={s.clientRow}>
            <span className={s.clientLabel}>From</span>
            <span className={s.clientValue}>Protocol Labs Network &lt;digest@protocol.ai&gt;</span>
          </div>
          <div className={s.clientRow}>
            <span className={s.clientLabel}>Subject</span>
            <span className={clsx(s.clientValue, s.clientSubject)}>{DIGEST.subject}</span>
          </div>
        </div>

        <div className={s.email}>
          <header className={s.emailHead}>
            <p className={s.masthead}>Protocol Labs Network</p>
            <p className={s.emailWeek}>Weekly digest · Week of {weekOf}</p>
          </header>

          <section className={s.top}>
            <p className={s.kicker}>Top story</p>
            <h2 className={s.topTitle}>{DIGEST.topStory.title}</h2>
            <p className={s.topSummary}>{DIGEST.topStory.summary}</p>
            <a className={s.cta} href="#top-story">
              Read the story →
            </a>
            <p className={s.sourceLine}>
              {DIGEST.topStory.team} · {DIGEST.topStory.source}
            </p>
          </section>

          <section className={s.section}>
            <h2 className={s.sectionTitle}>Also this week</h2>
            <ul className={s.list}>
              {DIGEST.stories.map((story) => (
                <li key={story.uid} className={s.storyItem}>
                  <span className={s.chip}>{story.label}</span>
                  <span className={s.itemText}>
                    <a className={s.itemLink} href="#story">
                      {story.title}
                    </a>
                    <span className={s.itemMeta}>{story.team}</span>
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <EventsSection events={events} />

          <section className={s.section}>
            <h2 className={s.sectionTitle}>Who started hiring</h2>
            <ul className={s.list}>
              {DIGEST.hiring.map((line) => (
                <li key={line.uid} className={s.lineItem}>
                  <a className={s.itemLink} href="#hiring">
                    {line.title}
                  </a>
                  <span className={s.itemMeta}>{line.meta}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className={s.section}>
            <h2 className={s.sectionTitle}>From the forum</h2>
            <ul className={s.list}>
              {DIGEST.forum.map((line) => (
                <li key={line.uid} className={s.lineItem}>
                  <a className={s.itemLink} href="/forum">
                    {line.title}
                  </a>
                  <span className={s.itemMeta}>{line.meta}</span>
                </li>
              ))}
            </ul>
          </section>

          <footer className={s.foot}>
            <p>You get this email because you subscribed to the network digest. It arrives every Monday.</p>
            <p>
              <a href="/settings/email-preferences">Choose what is in your digest</a> ·{' '}
              <a href="/settings/email-preferences">Unsubscribe</a>
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}
