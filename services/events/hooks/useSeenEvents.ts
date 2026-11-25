import { useMemo, useState } from 'react';

import type { AllEventsItem } from '../all-events.types';
import { useEventClock } from './useEventClock';

/** An event's row, and the turn it came in: a later list has a higher one. */
type Row = { item: AllEventsItem; turn: number };
type Rows = Map<string, Row>;

interface Held {
  /** The newest of each list. */
  loaded: AllEventsItem[];
  listed: AllEventsItem[];
  turn: number;
  /** Each event's newest row from the page's own lists, and from the route's. */
  page: Rows;
  route: Rows;
}

const NOTHING: Held = { loaded: [], listed: [], turn: 0, page: new Map(), route: new Map() };

const put = (rows: Rows, items: AllEventsItem[], turn: number) =>
  items.forEach((item) => rows.set(item.uid, { item, turn }));

const same = (a: AllEventsItem[], b: AllEventsItem[]) =>
  a === b || (a.length === b.length && a.every((item, i) => item === b[i]));

/** `held` with both lists taken in. `started` are its rows under way or over when the lists came. */
function take(held: Held, loaded: AllEventsItem[], listed: AllEventsItem[], started: Set<AllEventsItem>): Held {
  const page = new Map(held.page);
  const route = new Map(held.route);
  if (!same(loaded, held.loaded)) {
    // An event that had not started is what the new list has for it, or is off: older copies go, the route's too.
    page.forEach((_, uid) => {
      [page, route].forEach((rows) => {
        const row = rows.get(uid);
        if (row && !started.has(row.item)) rows.delete(uid);
      });
    });
    put(page, loaded, held.turn + 2);
  }
  if (!same(listed, held.listed)) put(route, listed, held.turn + 1);
  return { loaded, listed, turn: held.turn + 2, page, route };
}

const itemsOf = (rows: Rows) => Array.from(rows.values(), (row) => row.item);
const startOf = (item: AllEventsItem) => new Date(item.startDate).getTime();

/**
 * The events of both tabs, once each, soonest first (LAB-3418): `loaded` is the page's own list, `listed` the past
 * events route's. The row of the newest page list wins. An event that has not started is here only while that list
 * has it. One that has started stays until the page is left, by the newest row that says so: a list that loads again
 * without it, or one from before it began, never takes it off. `fromPage` is the part the page's own lists have held.
 */
export function useSeenEvents(
  loaded: AllEventsItem[],
  listed: AllEventsItem[],
  serverNow: number,
): { seen: AllEventsItem[]; fromPage: AllEventsItem[]; liveUids: Set<string>; endedUids: Set<string> } {
  const [held, setHeld] = useState<Held>(() => take(NOTHING, loaded, listed, new Set()));
  const rows = useMemo(() => [...itemsOf(held.page), ...itemsOf(held.route)], [held]);
  const { live, ended } = useEventClock(rows, serverNow);
  if (!same(loaded, held.loaded) || !same(listed, held.listed)) {
    setHeld(take(held, loaded, listed, new Set([...Array.from(live), ...Array.from(ended)])));
  }

  return useMemo(() => {
    const current = new Set(held.loaded.map((item) => item.uid));
    const seen: AllEventsItem[] = [];
    held.page.forEach(({ item, turn }, uid) => {
      const later = held.route.get(uid);
      // An ended page row stays ended.
      const fresher =
        !current.has(uid) &&
        !ended.has(item) &&
        later &&
        later.turn > turn &&
        (live.has(later.item) || ended.has(later.item));
      seen.push(fresher ? later.item : item);
    });
    held.route.forEach(({ item }, uid) => {
      if (!held.page.has(uid) && (live.has(item) || ended.has(item))) seen.push(item);
    });
    seen.sort((a, b) => startOf(a) - startOf(b));
    const uidsIn = (items: Set<AllEventsItem>) =>
      new Set(seen.filter((item) => items.has(item)).map((item) => item.uid));
    return {
      seen,
      fromPage: seen.filter((item) => held.page.has(item.uid)),
      liveUids: uidsIn(live),
      endedUids: uidsIn(ended),
    };
  }, [held, live, ended]);
}
