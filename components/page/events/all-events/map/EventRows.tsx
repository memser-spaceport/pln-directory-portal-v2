import clsx from 'clsx';

import { GoingPill } from '@/components/page/events/GoingPill/GoingPill';
import { GoingFaces } from '@/components/page/events/all-events/GoingFaces';
import { spanLabel } from '@/services/events/all-events.filters';
import type { AllEventsItem } from '@/services/events/all-events.types';

import m from './EventsMap.module.scss';

/**
 * One line per event under the map (online, and in person with no place): its dates, its name, the faces and
 * "N going" (LAB-3353) and the Going pill. Each opens the drawer.
 */
export function EventRows({
  events,
  goingUids,
  highlightUid,
  onOpen,
  onPrepare,
}: {
  events: AllEventsItem[];
  goingUids: Set<string>;
  highlightUid?: string | null;
  onOpen: (uid: string) => void;
  onPrepare: (uid: string) => void;
}) {
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
            <span className={m.rowEnd}>
              <GoingFaces item={e} />
              {goingUids.has(e.uid) && <GoingPill />}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
