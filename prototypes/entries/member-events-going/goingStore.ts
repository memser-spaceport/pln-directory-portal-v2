'use client';

import { useSyncExternalStore } from 'react';

import type { EventRole, EventRoleSelection } from '@/components/core/UpdatesPanel/IrlGatheringModal/types';

/**
 * Who said they're going, mocked for the session. sessionStorage rather than
 * component state, because the point of the flow crosses two routes: mark an
 * event on Home, then find it on your profile.
 *
 * `owner` is Maya, whose profile the prototype shows. `visitor` is someone
 * reading her profile, whose own answers must not land on it.
 */
export type GoingScope = 'owner' | 'visitor';

export interface GoingEntry {
  roles: EventRole[];
  showOnProfile: boolean;
}

export type GoingMap = Record<string, GoingEntry>;
type GoingState = Record<GoingScope, GoingMap>;

const KEY = 'member-events-going:v1';

/* Opens with plans on the profile: the section is what's under review. */
export const SEEDED_OWNER: GoingMap = {
  'labweek-lisbon': { roles: ['Attendee', 'Speaker'], showOnProfile: true },
  'dai-founders-dinner': { roles: ['Attendee'], showOnProfile: true },
};

const SEED: GoingState = { owner: SEEDED_OWNER, visitor: {} };

let state: GoingState | null = null;
const listeners = new Set<() => void>();

function read(): GoingState {
  if (state) return state;
  let stored: GoingState | null = null;
  try {
    const raw = window.sessionStorage.getItem(KEY);
    stored = raw ? (JSON.parse(raw) as GoingState) : null;
  } catch {
    stored = null;
  }
  state = stored ?? SEED;
  return state;
}

function write(next: GoingState) {
  state = next;
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Private windows can refuse storage; the page still works for this visit.
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function update(scope: GoingScope, change: (map: GoingMap) => GoingMap) {
  const current = read();
  write({ ...current, [scope]: change(current[scope]) });
}

export function useGoing(scope: GoingScope): GoingMap {
  const snapshot = useSyncExternalStore(subscribe, read, () => SEED);
  return snapshot[scope];
}

export function markGoing(scope: GoingScope, eventUid: string, showOnProfile: boolean) {
  update(scope, (map) => ({ ...map, [eventUid]: { roles: ['Attendee'], showOnProfile } }));
}

/** Step two's Save: the gathering's events become exactly what the form holds. */
export function saveGathering(
  scope: GoingScope,
  gatheringEventUids: string[],
  selected: string[],
  roles: EventRoleSelection[],
  showOnProfile: boolean,
) {
  update(scope, (map) => {
    const next = { ...map };
    gatheringEventUids.forEach((uid) => delete next[uid]);
    selected.forEach((uid) => {
      next[uid] = {
        roles: roles.find((r) => r.eventUid === uid)?.roles ?? ['Attendee'],
        showOnProfile,
      };
    });
    return next;
  });
}

export function removeGoing(scope: GoingScope, eventUid: string) {
  update(scope, (map) => {
    const next = { ...map };
    delete next[eventUid];
    return next;
  });
}

export function setShowOnProfile(scope: GoingScope, eventUid: string, showOnProfile: boolean) {
  update(scope, (map) => (map[eventUid] ? { ...map, [eventUid]: { ...map[eventUid], showOnProfile } } : map));
}

/** Review band: put the profile back in either state. */
export function setOwnerPlans(map: GoingMap) {
  update('owner', () => map);
}
