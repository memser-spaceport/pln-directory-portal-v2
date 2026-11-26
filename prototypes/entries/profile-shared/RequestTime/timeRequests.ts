'use client';

import { useMemo, useSyncExternalStore } from 'react';

/**
 * LAB-3400 "Request time" — a visitor asks a member with no Office hours link
 * for a call. Not an intro (the PL team is not in it) and not a booking (no
 * slot is held): the member gets one email and one in-app notice, and answers
 * the visitor directly or sets up office hours.
 *
 * One request per member, the intro store's rule (`intro-shared/introRequests`)
 * and its reasoning: a reviewer moves between prototype routes in one tab, so
 * session storage; a fresh tab opens on the fixture as shipped.
 */
export interface TimeTarget {
  uid: string;
  name: string;
}

export interface TimeRequest extends TimeTarget {
  /** "What would you like to talk about?" — required. */
  message: string;
  /** ISO stamp. */
  sentAt: string;
}

const STORAGE_KEY = 'pln-prototypes:time-requests';
const EMPTY: TimeRequest[] = [];

let current: TimeRequest[] | null = null;
const listeners = new Set<() => void>();

function read(): TimeRequest[] {
  if (current) return current;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    current = raw ? (JSON.parse(raw) as TimeRequest[]) : EMPTY;
  } catch {
    current = EMPTY;
  }
  return current;
}

function commit(next: TimeRequest[]) {
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

export function useTimeRequests() {
  // Server snapshot is empty, so SSR and the first client render agree.
  const requests = useSyncExternalStore(subscribe, read, () => EMPTY);

  return useMemo(
    () => ({
      requests,
      requestFor: (uid: string) => requests.find((r) => r.uid === uid),
      requested: (uid: string) => requests.some((r) => r.uid === uid),
      send: (target: TimeTarget, message: string) =>
        commit([
          ...read().filter((r) => r.uid !== target.uid),
          { ...target, message, sentAt: new Date().toISOString() },
        ]),
      /** Review band only: forget the request so the flow can be shown again. */
      reset: (uid: string) => commit(read().filter((r) => r.uid !== uid)),
    }),
    [requests],
  );
}
