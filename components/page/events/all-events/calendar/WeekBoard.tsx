import clsx from 'clsx';
import type { CSSProperties } from 'react';

import { EventImage } from '@/components/page/events/EventImage/EventImage';
import { GoingPill } from '@/components/page/events/GoingPill/GoingPill';
import { GoingFaces } from '@/components/page/events/all-events/GoingFaces';
import { shortDate, spanLabel, timeRange } from '@/services/events/all-events.filters';
import { eventPlace } from '@/services/events/event-facts';
import type { AllEventsItem } from '@/services/events/all-events.types';

import { addDays, byStart, dayNumber, eventsBetween, isMultiDay, spanColumns, weekDays, weekdayName } from './weeks';
import k from './Calendar.module.scss';

export interface CalendarCardProps {
  goingUids: Set<string>;
  highlightUid: string | null;
  onOpen: (uid: string) => void;
  onPrepare: (uid: string) => void;
}

/**
 * Week: the LabWeek 2023 schedule board. A header cell per day (today brand blue, past days dimmed); an event that runs
 * several days is one card across its days on top; one-day events stack in their day's column, earliest first. Times
 * are the event's own, with its zone. Phones get the same cards stacked by day, empty days skipped.
 */
export function WeekBoard({
  events,
  monday,
  todayIso,
  ...cards
}: CalendarCardProps & { events: AllEventsItem[]; monday: string; todayIso: string }) {
  const days = weekDays(monday);
  const inWeek = eventsBetween(events, monday, addDays(monday, 6)).sort(byStart);
  const spanning = inWeek.filter(isMultiDay);
  const single = (day: string) => inWeek.filter((e) => !isMultiDay(e) && e.startDay === day);
  const busyDays = days.filter((d) => single(d).length > 0);

  return (
    <div className={k.board}>
      <div className={k.boardGrid}>
        {/* Days before today, greyed behind their header and cards (LAB-3353). */}
        {days.map(
          (d, i) =>
            d < todayIso && (
              <span
                key={`past-${d}`}
                className={k.pastDay}
                data-past-day={d}
                style={{ gridColumn: i + 1, gridRow: `1 / span ${spanning.length + 2}` }}
                aria-hidden
              />
            ),
        )}
        {days.map((d, i) => (
          <DayHead key={d} day={d} todayIso={todayIso} style={{ gridColumn: i + 1, gridRow: 1 }} />
        ))}
        {spanning.map((e, row) => {
          const { start, end } = spanColumns(e, monday);
          return (
            <SpanCard
              key={e.uid}
              event={e}
              style={{ gridColumn: `${start + 1} / ${end + 2}`, gridRow: row + 2 }}
              {...cards}
            />
          );
        })}
        {days.map((d, i) => (
          <div key={d} className={k.boardCol} style={{ gridColumn: i + 1, gridRow: spanning.length + 2 }}>
            {single(d).map((e) => (
              <DayCard key={e.uid} event={e} {...cards} />
            ))}
          </div>
        ))}
      </div>

      <div className={k.boardStack}>
        {spanning.map((e) => (
          <SpanCard key={e.uid} event={e} {...cards} />
        ))}
        {busyDays.map((d) => (
          <div key={d} className={k.stackDay}>
            <DayHead day={d} todayIso={todayIso} long />
            {single(d).map((e) => (
              <DayCard key={e.uid} event={e} {...cards} />
            ))}
          </div>
        ))}
      </div>

      {inWeek.length === 0 && <p className={k.boardEmpty}>Nothing this week.</p>}
    </div>
  );
}

function DayHead({
  day,
  todayIso,
  long,
  style,
}: {
  day: string;
  todayIso: string;
  long?: boolean;
  style?: CSSProperties;
}) {
  return (
    <div
      className={clsx(k.boardHead, day === todayIso && k.boardHeadToday, day < todayIso && k.boardHeadPast)}
      style={style}
    >
      <span className={k.boardDate}>{long ? shortDate(day) : dayNumber(day)}</span>
      <span className={k.boardWeekday}>{day === todayIso ? 'Today' : weekdayName(day, long ? 'long' : 'short')}</span>
    </div>
  );
}

/** "Online", "Lisbon · also online", "Lisbon": the city, since the cards are narrow. */
const placeOf = (e: AllEventsItem) => eventPlace(e.mode, e.city)?.text ?? '';

function cardHandlers(e: AllEventsItem, { onOpen, onPrepare }: CalendarCardProps) {
  return {
    onClick: () => onOpen(e.uid),
    onPointerEnter: () => onPrepare(e.uid),
    onFocus: () => onPrepare(e.uid),
  };
}

/** A multi-day event: one card across its days. */
function SpanCard({ event, style, ...cards }: CalendarCardProps & { event: AllEventsItem; style?: CSSProperties }) {
  return (
    <button
      type="button"
      data-event-uid={event.uid}
      className={clsx(k.span, event.uid === cards.highlightUid && k.cardHighlight)}
      style={style}
      {...cardHandlers(event, cards)}
    >
      <EventImage src={event.picture} className={k.spanThumb} />
      <span className={k.spanText}>
        <span className={k.cardTitle}>{event.name}</span>
        <span className={k.cardMeta}>
          {[spanLabel(event.startDay, event.endDay), placeOf(event)].filter(Boolean).join(' · ')}
        </span>
        <GoingFaces item={event} className={k.cardGoing} />
      </span>
      {cards.goingUids.has(event.uid) && <GoingPill />}
    </button>
  );
}

/** A one-day event: title, first topic + "+n", local time ("All day" without one), place with its zone. */
function DayCard({ event, ...cards }: CalendarCardProps & { event: AllEventsItem }) {
  const [first, ...rest] = event.tags;
  return (
    <button
      type="button"
      data-event-uid={event.uid}
      className={clsx(k.card, event.uid === cards.highlightUid && k.cardHighlight)}
      {...cardHandlers(event, cards)}
    >
      <span className={k.cardTitle}>{event.name}</span>
      {first && (
        <span className={k.cardTags}>
          <span className={k.cardTag}>#{first}</span>
          {rest.length > 0 && <span className={k.cardTagMore}>+{rest.length}</span>}
        </span>
      )}
      <span className={k.cardMeta}>{timeRange(event) || 'All day'}</span>
      <span className={k.cardMeta}>{[placeOf(event), event.zone].filter(Boolean).join(' · ')}</span>
      <GoingFaces item={event} className={k.cardGoing} />
      {cards.goingUids.has(event.uid) && <GoingPill />}
    </button>
  );
}
