'use client';

import { useCallback, useMemo, useState, useSyncExternalStore } from 'react';

/**
 * What a member has kept — jobs from the board, stories and posts from the feed.
 *
 * **One record per item, keyed by uid, holding the kind and when.** Kind is
 * what lets each surface count its own ("Saved 2" on the board counts jobs,
 * the feed's counts updates) out of one store; `savedAt` is the chronology a
 * saved list needs, for the same reason the Applied tab stamps `appliedAt` —
 * inside the tab, "did I keep this?" is answered by the tab itself, and the
 * only question left is *when*.
 *
 * **Session storage, deliberately.** The board and the feed are two views of
 * one prototype, and a save on one has to be there when the reviewer switches
 * to the other — but a fresh tab should open on the fixture as shipped. Same
 * reasoning, and the same mechanism, as `news-shared/teamPosts.ts`.
 *
 * **Seeded with a few.** Follow state on the board is seeded empty so that it
 * is *earned* in the demo; saving is different. A returning member has saved
 * things before, and the Saved tabs need a "before" so the count treatment,
 * the "Saved 3d ago" clock and the list itself can be looked at without first
 * pressing three bookmarks. A reviewer who wants the empty states unsaves them
 * — three presses — and sessionStorage keeps that until the tab closes.
 */
export type SavedKind = 'job' | 'news' | 'forum';

export interface SavedRecord {
  kind: SavedKind;
  /** ISO stamp. */
  savedAt: string;
}

export type SavedItems = Record<string, SavedRecord>;

const STORAGE_KEY = 'pln-prototypes:saved-items';

const daysAgo = (n: number) => new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString();

/** The fixture: two roles and one story, kept on earlier visits. Uids are the
 *  board's (`job-board/mocks.ts`) and the feed's (`newsfeed-v0/mocks.ts`). */
export const SEEDED_SAVED_ITEMS: SavedItems = {
  'ff-1': { kind: 'job', savedAt: daysAgo(3) },
  'pl-2': { kind: 'job', savedAt: daysAgo(9) },
  n3: { kind: 'news', savedAt: daysAgo(2) },
};

export function readSavedItems(): SavedItems {
  if (typeof window === 'undefined') return SEEDED_SAVED_ITEMS;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SavedItems) : SEEDED_SAVED_ITEMS;
  } catch {
    return SEEDED_SAVED_ITEMS;
  }
}

function writeSavedItems(items: SavedItems) {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    /* storage blocked — the in-memory state still updates */
  }
}

export interface SavedItemsApi {
  items: SavedItems;
  isSaved: (uid: string) => boolean;
  savedAt: (uid: string) => string | undefined;
  /** Flips one item. Returns the new state — true when it was just saved — so
   *  the caller can confirm a save and stay quiet on an unsave. */
  toggle: (uid: string, kind: SavedKind) => boolean;
  /** How many of one kind are kept — the Saved tab's count on each surface. */
  countOf: (kind: SavedKind | SavedKind[]) => number;
  /** Every kept uid of one kind, as a Set — what a list filters on. */
  uidsOf: (kind: SavedKind | SavedKind[]) => Set<string>;
}

/** Hydrated yet? Server snapshot false, client true — no effect, no state. */
const useHydrated = () =>
  useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

/**
 * The store as a hook. Renders the seeds until hydration so the server render
 * and the first client render agree, then the session's own state; the first
 * toggle takes over from there. Storage is written in the toggle, not in an
 * effect — the write is part of the act, the same way the team-post mock does it.
 */
export function useSavedItems(): SavedItemsApi {
  const hydrated = useHydrated();
  const [touched, setTouched] = useState<SavedItems | null>(null);
  const stored = useMemo(() => (hydrated ? readSavedItems() : SEEDED_SAVED_ITEMS), [hydrated]);
  const items = touched ?? stored;

  const toggle = useCallback(
    (uid: string, kind: SavedKind) => {
      const next = { ...items };
      const nowSaved = !next[uid];
      if (nowSaved) next[uid] = { kind, savedAt: new Date().toISOString() };
      else delete next[uid];
      setTouched(next);
      writeSavedItems(next);
      return nowSaved;
    },
    [items],
  );

  return useMemo(() => {
    const kinds = (k: SavedKind | SavedKind[]) => (Array.isArray(k) ? k : [k]);
    return {
      items,
      isSaved: (uid) => !!items[uid],
      savedAt: (uid) => items[uid]?.savedAt,
      toggle,
      countOf: (k) => Object.values(items).filter((r) => kinds(k).includes(r.kind)).length,
      uidsOf: (k) =>
        new Set(
          Object.entries(items)
            .filter(([, r]) => kinds(k).includes(r.kind))
            .map(([uid]) => uid),
        ),
    };
  }, [items, toggle]);
}
