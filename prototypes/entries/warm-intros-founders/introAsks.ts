'use client';

import { useMemo, useSyncExternalStore } from 'react';

import { SEED_ASKS, type AskStatus, type IntroAsk } from './mocks';

/**
 * The founder's intro asks, as one store every door writes to.
 *
 * "Ask for intro" now stands in three places — the team page's Fundraising
 * section, an investor's profile, and an AI Search answer — and the rule they
 * share is **one ask per investor**. That only holds if they read one list: an
 * ask sent from a search answer has to be "Requested" on the investor's profile
 * and in the Fundraising asks a minute later, or the founder asks twice.
 *
 * A module-level store (not per-hook state) because one page can hold several
 * readers at once — two answers in one AI Search thread can list the same
 * investor. Session storage underneath, the `save-shared/savedItems.ts`
 * reasoning: the surfaces are separate prototype routes, a reviewer moves
 * between them in one tab, and a fresh tab opens on the fixture as shipped.
 */
const STORAGE_KEY = 'pln-prototypes:intro-asks';

let current: IntroAsk[] | null = null;
const listeners = new Set<() => void>();

function read(): IntroAsk[] {
  if (current) return current;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    current = raw ? (JSON.parse(raw) as IntroAsk[]) : SEED_ASKS;
  } catch {
    current = SEED_ASKS;
  }
  return current;
}

function commit(next: IntroAsk[]) {
  current = next;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* storage blocked — the in-memory state still updates */
  }
  listeners.forEach((notify) => notify());
}

const subscribe = (notify: () => void) => {
  listeners.add(notify);
  return () => listeners.delete(notify);
};

export interface IntroAsksApi {
  asks: IntroAsk[];
  askFor: (investorUid: string) => IntroAsk | undefined;
  /** Re-asking replaces: the founder is pursuing one intro per investor. */
  send: (ask: IntroAsk) => void;
  setStatus: (investorUid: string, status: AskStatus) => void;
}

export function useIntroAsks(): IntroAsksApi {
  // Server snapshot is the fixture, so SSR and the first client render agree.
  const asks = useSyncExternalStore(subscribe, read, () => SEED_ASKS);

  return useMemo(
    () => ({
      asks,
      askFor: (uid) => asks.find((a) => a.investorUid === uid),
      send: (ask) => commit([...read().filter((a) => a.investorUid !== ask.investorUid), ask]),
      setStatus: (uid, status) =>
        commit(read().map((a) => (a.investorUid === uid ? { ...a, status, daysAgo: 0 } : a))),
    }),
    [asks],
  );
}
