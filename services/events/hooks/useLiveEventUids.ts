import { useCallback, useMemo, useSyncExternalStore } from 'react';

import type { AllEventsItem } from '../all-events.types';
import { isLive } from '../event-live';

const MINUTE_MS = 60_000;

/** Ticks at the top of every minute, and when a hidden tab is shown again (its timers run late). */
function subscribeToMinutes(onTick: () => void): () => void {
  let timer = 0;
  const schedule = () => {
    timer = window.setTimeout(
      () => {
        onTick();
        schedule();
      },
      MINUTE_MS - (Date.now() % MINUTE_MS),
    );
  };
  const onVisibilityChange = () => {
    if (document.visibilityState === 'visible') onTick();
  };
  schedule();
  document.addEventListener('visibilitychange', onVisibilityChange);
  return () => {
    window.clearTimeout(timer);
    document.removeEventListener('visibilitychange', onVisibilityChange);
  };
}

const liveKey = (items: AllEventsItem[], now: number) =>
  items
    .filter((item) => isLive(item, now))
    .map((item) => item.uid)
    .join(' ');

/**
 * The events under way now (LAB-3425), kept current while the page stays open by one timer for the whole list. The
 * server and the first client render read `serverNow`, so their HTML matches; the browser's clock replaces it after
 * hydration. The snapshot is a string, so a minute in which nothing starts or ends renders nothing.
 */
export function useLiveEventUids(items: AllEventsItem[], serverNow: number): Set<string> {
  const key = useSyncExternalStore(
    subscribeToMinutes,
    useCallback(() => liveKey(items, Date.now()), [items]),
    useCallback(() => liveKey(items, serverNow), [items, serverNow]),
  );
  return useMemo(() => new Set(key ? key.split(' ') : []), [key]);
}
