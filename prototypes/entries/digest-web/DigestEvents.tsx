'use client';

import { useState } from 'react';

import { EventDrawer } from '../event-drawer-redesign/EventDrawer';
import { MODE_LABEL, timeLine } from '../event-drawer-redesign/format';
import { CAL_EVENTS, DETAILS, THUMBS, eventsAppHref, type CalEvent } from '../event-drawer-redesign/mocks';
import local from '../home-refactor/HomeRefactorPrototype.module.scss';
import { GoingMark } from '../member-events-going/EventRow';
import { useGoing } from '../member-events-going/goingStore';
import { TOTAL_UPCOMING_EVENTS } from '../member-events-going/mocks';

import { DIGEST_ISSUE } from './mocks';
import s from './DigestEvents.module.scss';

/** How far ahead the digest looks, and how many events it names. */
const WINDOW_DAYS = 28;
const MAX_EVENTS = 5;

/** The next four weeks of network events after the issue date, soonest first. */
export const DIGEST_EVENTS: CalEvent[] = (() => {
  const from = new Date(`${DIGEST_ISSUE.id}T12:00:00`);
  const to = new Date(from);
  to.setDate(to.getDate() + WINDOW_DAYS);
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  return CAL_EVENTS.filter((e) => e.startDate > iso(from) && e.startDate <= iso(to)).slice(0, MAX_EVENTS);
})();

const at = (iso: string) => new Date(`${iso}T12:00:00`);
const month = (iso: string) => at(iso).toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
const weekday = (iso: string) => at(iso).toLocaleDateString('en-US', { weekday: 'short' });

/**
 * "Upcoming events" in the digest (Luma's events list, Uxcel's "Upcoming events" on its
 * home): one row per event, the date tile Home's rail uses, then the name, when and where,
 * and who's going; the event's picture on the right. On the page a row opens the event
 * drawer (event-drawer-redesign), previous / next walking this list. In the email the
 * same rows are links to the events app, and the list ends on "See all events".
 */
export function DigestEvents({ asEmail, id }: { asEmail: boolean; id: string }) {
  const going = useGoing('owner');
  const [openUid, setOpenUid] = useState<string | null>(null);
  const sequence = DIGEST_EVENTS.map((e) => e.uid);

  return (
    <section id={id} className={`${s.section} ${asEmail ? s.sectionEmail : ''}`} aria-labelledby={`${id}-title`}>
      <div className={s.head}>
        <h2 id={`${id}-title`} className={s.title}>
          Upcoming events
        </h2>
        <p className={s.subtitle}>The next four weeks in the network</p>
      </div>

      <ul className={s.list}>
        {DIGEST_EVENTS.map((event) => {
          const detail = DETAILS[event.uid];
          const thumb = THUMBS[event.uid];
          const isGoing = !!going[event.uid];
          const days = event.startDate === event.endDate ? weekday(event.startDate) : event.range;
          const when = [days, detail && timeLine(detail).split(' · ')[0].split(' – ')[0]].filter(Boolean).join(' · ');
          const where = detail?.mode === 'Virtual' ? 'Online' : event.city;
          const content = (
            <>
              <span className={local.dateTile} aria-hidden>
                <span className={local.dateMonth}>{month(event.startDate)}</span>
                <span className={local.dateDay}>{at(event.startDate).getDate()}</span>
              </span>
              <span className={s.text}>
                <span className={s.name}>{event.name}</span>
                <span className={s.meta}>
                  {when} · {where}
                  {detail && detail.mode !== 'In-Person' && detail.mode !== 'Virtual' && (
                    <> · {MODE_LABEL[detail.mode]}</>
                  )}
                </span>
                <span className={s.going}>
                  {isGoing ? <GoingMark label="You're going" /> : `${event.attendeeCount} going`}
                </span>
              </span>
              {thumb && <img src={thumb} alt="" className={s.thumb} width={64} height={64} />}
            </>
          );
          return (
            <li key={event.uid}>
              {asEmail ? (
                <a href={eventsAppHref(event.uid)} className={s.row}>
                  {content}
                </a>
              ) : (
                <button type="button" className={s.row} onClick={() => setOpenUid(event.uid)}>
                  {content}
                </button>
              )}
            </li>
          );
        })}
      </ul>

      <a href={asEmail ? 'https://events.plnetwork.io' : '/prototypes/events-page-redesign'} className={s.seeAll}>
        See all {TOTAL_UPCOMING_EVENTS} events
      </a>

      {!asEmail && (
        <EventDrawer
          eventUid={openUid}
          sequence={sequence}
          onNavigate={setOpenUid}
          onClose={() => setOpenUid(null)}
        />
      )}
    </section>
  );
}
