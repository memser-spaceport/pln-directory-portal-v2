import { formatInTimeZone } from 'date-fns-tz';

import type { AllEventsItem } from './all-events.types';
import { eventEndMs } from './event-ended';

type LiveFields = Pick<AllEventsItem, 'startDate' | 'endDate' | 'startDay' | 'timezone'> &
  Partial<Pick<AllEventsItem, 'allDay'>>;

const DAY_MS = 86_400_000;

/**
 * Whether an event is under way at `now` (epoch ms): the Live pill (LAB-3425, LAB-3424 section 4). An event of 24 hours
 * or less is live from its start, also when it crosses midnight. A longer one is live from midnight of its first day,
 * in its own time zone. Both stop at the end. The viewer's time zone plays no part. An all-day event (LAB-3339) is live
 * from midnight of its first day to the end of its last, in its own time zone.
 */
export function isLive(event: LiveFields, now: number): boolean {
  const start = new Date(event.startDate).getTime();
  const end = eventEndMs(event.endDate, event.allDay, event.timezone);
  // Both written so that an unreadable date is never live.
  if (!(now < end)) return false;
  if (!event.allDay && !(end - start > DAY_MS)) return now >= start;
  try {
    return formatInTimeZone(now, event.timezone, 'yyyy-MM-dd') >= event.startDay;
  } catch {
    // The server checked the zone with its own time zone data; a browser that lacks it throws, here in a render.
    return now >= start;
  }
}
