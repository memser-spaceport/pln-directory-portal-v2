import { dayHeading, groupByDay, groupPastByDay, pastDayHeading } from '@/services/events/all-events.filters';
import type { AllEventsItem } from '@/services/events/all-events.types';

import { EventCard } from './EventCard';
import { EventsEmpty } from './states';
import s from './AllEventsPage.module.scss';

interface Props {
  events: AllEventsItem[];
  /** Past (LAB-3418): newest first, each event under its first day. */
  past?: boolean;
  todayIso: string;
  /** The events the viewer is going to; on Past, those they went to. */
  goingUids: Set<string>;
  /** The events under way now (LAB-3425). */
  liveUids: Set<string>;
  highlightUid: string | null;
  onOpen: (uid: string) => void;
  onPrepare: (uid: string) => void;
  /** Past: a card's faces and "N went" open the drawer on who went (P1). Left out where the list can't be opened. */
  onOpenPeople?: (uid: string) => void;
  onClear: () => void;
}

/**
 * The List (default view, LAB-3247): Luma's events list. A date column (day over weekday, held in view while its
 * events scroll), a dotted timeline with a dot per day, and the day's cards beside it. Phones drop the timeline and put
 * the date above its cards.
 */
export function ListView({
  events,
  past = false,
  todayIso,
  goingUids,
  liveUids,
  highlightUid,
  onOpen,
  onPrepare,
  onOpenPeople,
  onClear,
}: Props) {
  if (!events.length) return <EventsEmpty past={past} onClear={onClear} />;

  return (
    <ol className={s.timeline}>
      {(past ? groupPastByDay(events) : groupByDay(events, todayIso)).map(({ day, events: dayEvents }) => {
        const { label, weekday } = past ? pastDayHeading(day, todayIso) : dayHeading(day, todayIso);
        return (
          <li key={day} className={s.day}>
            <h3 className={s.dayHeading}>
              {label}
              <span className={s.dayWeekday}>{weekday}</span>
            </h3>
            <ul className={s.dayEvents}>
              {dayEvents.map((item) => (
                <li key={item.uid}>
                  <EventCard
                    item={item}
                    day={day}
                    going={goingUids.has(item.uid)}
                    past={past}
                    live={liveUids.has(item.uid)}
                    highlighted={item.uid === highlightUid}
                    onOpen={() => onOpen(item.uid)}
                    onPrepare={() => onPrepare(item.uid)}
                    onOpenPeople={onOpenPeople && (() => onOpenPeople(item.uid))}
                  />
                </li>
              ))}
            </ul>
          </li>
        );
      })}
    </ol>
  );
}
