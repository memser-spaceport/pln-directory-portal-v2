import type { AgendaDay } from '@/services/events/event-form';

import s from './AgendaList.module.scss';

/** The agenda by day: "Day 1" with its date, then each session as "start – end • title" over its description. */
export function AgendaList({ days }: { days: AgendaDay[] }) {
  return (
    <ol className={s.days}>
      {days.map((day) => (
        <li key={day.label} className={s.day}>
          <h4 className={s.dayTitle}>
            <span>{day.label}</span> <span className={s.date}>{day.date}</span>
          </h4>
          <ul className={s.items}>
            {day.items.map((item, index) => (
              <li key={`${item.time}-${index}`}>
                <p className={s.item}>{`${item.time} • ${item.title}`}</p>
                {item.description && <p className={s.description}>{item.description}</p>}
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ol>
  );
}
