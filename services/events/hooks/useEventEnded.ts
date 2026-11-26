import { useCallback, useReducer, useSyncExternalStore } from 'react';

import { eventEndMs, isEventEnded } from '../event-ended';

/**
 * The longest wait between two looks at the clock. A timer set straight for the end would miss it after the computer
 * slept, and one more than 24 days away would fire at once.
 */
const MAX_WAIT_MS = 30_000;

/**
 * Whether the event has ended (LAB-3426). Turns true on screen when the end comes. `checkEnded` looks at the clock now:
 * call it before saving, and when it has ended the screen says so at once. An all-day event ends with its last day, in
 * its time zone.
 */
export function useEventEnded(
  endDate: string,
  allDay = false,
  timezone = 'UTC',
): { ended: boolean; checkEnded: () => boolean } {
  const subscribe = useCallback(
    (onChange: () => void) => {
      let timer: ReturnType<typeof setTimeout> | undefined;
      const check = () => {
        clearTimeout(timer);
        onChange();
        const left = eventEndMs(endDate, allDay, timezone) - Date.now();
        if (left > 0) timer = setTimeout(check, Math.min(left, MAX_WAIT_MS));
      };
      check();
      document.addEventListener('visibilitychange', check);
      return () => {
        clearTimeout(timer);
        document.removeEventListener('visibilitychange', check);
      };
    },
    [endDate, allDay, timezone],
  );
  const getSnapshot = () => isEventEnded(endDate, Date.now(), allDay, timezone);
  const ended = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  // A render reads the clock again.
  const [, render] = useReducer((n: number) => n + 1, 0);
  const checkEnded = () => {
    const now = isEventEnded(endDate, Date.now(), allDay, timezone);
    if (now) render();
    return now;
  };

  return { ended, checkEnded };
}
