import { useCallback, useReducer, useSyncExternalStore } from 'react';

import { isEventEnded } from '../event-ended';

/**
 * The longest wait between two looks at the clock. A timer set straight for the end would miss it after the computer
 * slept, and one more than 24 days away would fire at once.
 */
const MAX_WAIT_MS = 30_000;

/**
 * Whether the event has ended (LAB-3426). Turns true on screen when the end comes. `checkEnded` looks at the clock now:
 * call it before saving, and when it has ended the screen says so at once.
 */
export function useEventEnded(endDate: string): { ended: boolean; checkEnded: () => boolean } {
  const subscribe = useCallback(
    (onChange: () => void) => {
      let timer: ReturnType<typeof setTimeout> | undefined;
      const check = () => {
        clearTimeout(timer);
        onChange();
        const left = new Date(endDate).getTime() - Date.now();
        if (left > 0) timer = setTimeout(check, Math.min(left, MAX_WAIT_MS));
      };
      check();
      document.addEventListener('visibilitychange', check);
      return () => {
        clearTimeout(timer);
        document.removeEventListener('visibilitychange', check);
      };
    },
    [endDate],
  );
  const getSnapshot = () => isEventEnded(endDate);
  const ended = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  // A render reads the clock again.
  const [, render] = useReducer((n: number) => n + 1, 0);
  const checkEnded = () => {
    const now = isEventEnded(endDate);
    if (now) render();
    return now;
  };

  return { ended, checkEnded };
}
