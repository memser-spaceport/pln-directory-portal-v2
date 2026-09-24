'use client';

import { useMemo, useSyncExternalStore } from 'react';

/**
 * Intro requests sent to the PL team, as one store every door writes to.
 *
 * "Request an intro" stands on a member's profile, on a team's profile, and on
 * every member row and card in search. The rule they share is one request per
 * person or team: a request sent from a search row has to read "Intro
 * requested" on that member's profile a minute later, or the founder asks
 * twice. Session storage underneath — the `warm-intros-founders/introAsks.ts`
 * reasoning: the surfaces are separate prototype routes, a reviewer moves
 * between them in one tab, and a fresh tab opens on the fixture as shipped.
 */
export type IntroTargetKind = 'member' | 'team';

export interface IntroTarget {
  uid: string;
  name: string;
  kind: IntroTargetKind;
}

export interface IntroRequest extends IntroTarget {
  message: string;
  /** ISO stamp. */
  sentAt: string;
}

/** What a list surface (search rows, answer cards) needs to offer the intro on a member. */
export interface RequestIntroApi {
  requested: (uid: string) => boolean;
  onRequest: (target: IntroTarget) => void;
}

const STORAGE_KEY = 'pln-prototypes:intro-requests';
const EMPTY: IntroRequest[] = [];

let current: IntroRequest[] | null = null;
const listeners = new Set<() => void>();

function read(): IntroRequest[] {
  if (current) return current;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    current = raw ? (JSON.parse(raw) as IntroRequest[]) : EMPTY;
  } catch {
    current = EMPTY;
  }
  return current;
}

function commit(next: IntroRequest[]) {
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

export interface IntroRequestsApi {
  requests: IntroRequest[];
  requestFor: (uid: string) => IntroRequest | undefined;
  requested: (uid: string) => boolean;
  send: (target: IntroTarget, message: string) => void;
}

export function useIntroRequests(): IntroRequestsApi {
  // Server snapshot is empty, so SSR and the first client render agree.
  const requests = useSyncExternalStore(subscribe, read, () => EMPTY);

  return useMemo(
    () => ({
      requests,
      requestFor: (uid) => requests.find((r) => r.uid === uid),
      requested: (uid) => requests.some((r) => r.uid === uid),
      send: (target, message) =>
        commit([
          ...read().filter((r) => r.uid !== target.uid),
          { ...target, message, sentAt: new Date().toISOString() },
        ]),
    }),
    [requests],
  );
}
