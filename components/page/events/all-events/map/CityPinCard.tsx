import clsx from 'clsx';

import { CloseIcon } from '@/components/icons';
import { GoingPill } from '@/components/page/events/GoingPill/GoingPill';
import { spanLabel } from '@/services/events/all-events.filters';
import type { AllEventsItem } from '@/services/events/all-events.types';

import type { CityPin } from './pins';
import m from './EventsMap.module.scss';

interface RowsProps {
  events: AllEventsItem[];
  goingUids: Set<string>;
  highlightUid?: string | null;
  onOpen: (uid: string) => void;
  onPrepare: (uid: string) => void;
}

/** One line per event: its dates, its name and the Going pill. Each opens the drawer. */
export function EventRows({ events, goingUids, highlightUid, onOpen, onPrepare }: RowsProps) {
  return (
    <ul className={m.rows}>
      {events.map((e) => (
        <li key={e.uid}>
          <button
            type="button"
            className={clsx(m.row, e.uid === highlightUid && m.rowHighlight)}
            data-event-uid={e.uid}
            onClick={() => onOpen(e.uid)}
            onPointerEnter={() => onPrepare(e.uid)}
            onFocus={() => onPrepare(e.uid)}
          >
            <span className={m.rowDate}>{spanLabel(e.startDay, e.endDay)}</span>
            <span className={m.rowName}>{e.name}</span>
            {goingUids.has(e.uid) && <GoingPill />}
          </button>
        </li>
      ))}
    </ul>
  );
}

/** A city pin holding several events: the card that lists them, docked over the map's corner. */
export function CityPinCard({
  pin,
  onClose,
  ...rows
}: Omit<RowsProps, 'events'> & { pin: CityPin; onClose: () => void }) {
  const count = pin.events.length;
  return (
    <div className={m.card} role="dialog" aria-label={`Events in ${pin.city}`}>
      <div className={m.cardHead}>
        <span className={m.cardTitle}>
          {pin.city} · {count} {count === 1 ? 'event' : 'events'}
        </span>
        <button type="button" className={m.cardClose} onClick={onClose} aria-label="Close">
          <CloseIcon width={16} height={16} />
        </button>
      </div>
      <EventRows events={pin.events} {...rows} />
    </div>
  );
}
