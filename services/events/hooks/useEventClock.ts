import { useCallback, useMemo, useSyncExternalStore } from 'react';

import type { AllEventsItem } from '../all-events.types';
import { isEventEnded } from '../event-ended';
import { isLive } from '../event-live';

const MINUTE_MS = 60_000;

/** Until the top of the next minute, or the next event's end when that comes first. */
function untilNextTick(items: AllEventsItem[], now: number): number {
  return items.reduce(
    (wait, item) => {
      const left = new Date(item.endDate).getTime() - now;
      return left > 0 ? Math.min(wait, left) : wait;
    },
    MINUTE_MS - (now % MINUTE_MS),
  );
}

/** Ticks then, and when a hidden tab is shown again (its timers run late). */
function subscribeTo(items: AllEventsItem[], onTick: () => void): () => void {
  let timer = 0;
  const schedule = () => {
    timer = window.setTimeout(
      () => {
        onTick();
        schedule();
      },
      untilNextTick(items, Date.now()),
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

/** The places in `items` of those that `test` takes. */
const placesOf = (items: AllEventsItem[], test: (item: AllEventsItem) => boolean) =>
  items.flatMap((item, i) => (test(item) ? [i] : [])).join(' ');

const clockKey = (items: AllEventsItem[], now: number) =>
  [placesOf(items, (item) => isLive(item, now)), placesOf(items, (item) => isEventEnded(item.endDate, now))].join('|');

const toSet = (items: AllEventsItem[], places: string) =>
  new Set(places ? places.split(' ').map((i) => items[Number(i)]) : []);

/**
 * Those of `items` under way now (LAB-3425) and those that have ended (LAB-3418), kept current while the page stays open by
 * one timer for the whole list. The server and the first client render read `serverNow`, so their HTML matches; the
 * browser's clock replaces it after hydration. The snapshot is a string, so a tick in which nothing starts or ends
 * renders nothing.
 */
export function useEventClock(
  items: AllEventsItem[],
  serverNow: number,
): { live: Set<AllEventsItem>; ended: Set<AllEventsItem> } {
  const key = useSyncExternalStore(
    useCallback((onTick: () => void) => subscribeTo(items, onTick), [items]),
    useCallback(() => clockKey(items, Date.now()), [items]),
    useCallback(() => clockKey(items, serverNow), [items, serverNow]),
  );
  return useMemo(() => {
    const [live, ended] = key.split('|');
    return { live: toSet(items, live), ended: toSet(items, ended) };
  }, [key, items]);
}
