import { dayHeading, groupByDay } from '@/services/events/all-events.filters';
import type { AllEventsItem } from '@/services/events/all-events.types';

import { EventCard } from './EventCard';
import { EventsEmpty } from './states';
import s from './AllEventsPage.module.scss';

interface Props {
  events: AllEventsItem[];
  todayIso: string;
  goingUids: Set<string>;
  highlightUid: string | null;
  onOpen: (uid: string) => void;
  onPrepare: (uid: string) => void;
  onClear: () => void;
}

/**
 * The List (default view, LAB-3247): Luma's events list. A date column (day over weekday, held in view while its
 * events scroll), a dotted timeline with a dot per day, and the day's cards beside it. Phones drop the timeline and put
 * the date above its cards.
 */
export function ListView({ events, todayIso, goingUids, highlightUid, onOpen, onPrepare, onClear }: Props) {
  if (!events.length) return <EventsEmpty onClear={onClear} />;

  return (
    <ol className={s.timeline}>
      {groupByDay(events, todayIso).map(({ day, events: dayEvents }) => {
        const { label, weekday } = dayHeading(day, todayIso);
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
                    highlighted={item.uid === highlightUid}
                    onOpen={() => onOpen(item.uid)}
                    onPrepare={() => onPrepare(item.uid)}
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
