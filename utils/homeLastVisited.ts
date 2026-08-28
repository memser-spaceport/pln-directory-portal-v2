/* When this browser last looked at /home.
 *
 * The app header's Home button shows a dot when news arrived since — this is
 * the "since". Kept client-side because the server has no idea when a member
 * last read the feed; there is no read-state for team news, and inventing one
 * means real per-account bookkeeping (see the brainstorm's rejected option).
 *
 * Per-browser by choice: a second device dots independently. That is the
 * accepted cost of an ambient nudge rather than an inbox.
 *
 * localStorage, not sessionStorage: "since you last read the feed" has to
 * outlive the tab, or every new tab would claim there's news. */
const STORAGE_KEY = 'home-last-visited-at';

/** Epoch ms, or null when this browser has never recorded a visit. */
function read(): number | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = Number(raw);
    // A hand-edited or half-written value must read as "never visited", not as
    // a NaN that silently loses every comparison it takes part in.
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  } catch {
    // Private mode, blocked storage, quota — treat as never visited.
    return null;
  }
}

/* Read through useSyncExternalStore rather than an effect, so the value is
   there on the first client commit instead of a render later, and the server
   snapshot stays null — localStorage doesn't exist during SSR, and claiming
   otherwise would hydrate a dot over server markup that has none.
   Same shape as utils/gantryAgentSessionStorage.ts.

   getSnapshot returns a primitive (number | null), so React's identity check is
   a value comparison and there is nothing to memoize. */
const listeners = new Set<() => void>();

export function subscribeHomeLastVisited(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getHomeLastVisitedAt(): number | null {
  return read();
}

/** The server can never know this. Always null, so SSR and the first client
 *  render agree that there is no dot yet. */
export function getHomeLastVisitedServerSnapshot(): null {
  return null;
}

/** Called when the member lands on /home. Stamping on arrival is what clears
 *  the dot; there is no separate "mark as read". */
export function markHomeVisited(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, String(Date.now()));
  } catch {
    // Losing the stamp only costs a dot that stays lit; never break the page.
  }
  listeners.forEach((listener) => listener());
}
