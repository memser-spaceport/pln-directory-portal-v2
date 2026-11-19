import Link from 'next/link';

import { EVENTS_MINE_PATH } from '@/utils/events-submit';

import s from './EditEventPage.module.scss';

/** An unknown event, or one this member may not edit. */
export function EventUnavailable() {
  return (
    <div className={s.state} role="status">
      <p className={s.stateText}>Oops! This event is no longer available.</p>
      <Link href={EVENTS_MINE_PATH} className={s.stateLink}>
        Back to my events
      </Link>
    </div>
  );
}
