'use client';

import { useMemo } from 'react';

import { useDebounce } from '@/hooks/useDebounce';

import { MOCK_HIRING_TEAMS, MOCK_NETWORK_MEMBERS } from '../../../mocks';

import { DirectoryMember } from '../types';

const SEARCH_LIMIT = 15;
const DEBOUNCE_MS = 300;

/**
 * Members matching what's being typed — **mock-backed in this folder**.
 *
 * The job-board copy of this hook calls `/api/members-search`, which attaches the
 * caller's auth token and 401s without a real session. This board's "signed in"
 * viewers are the switcher's pretend ones, so even they met "Sign in to search
 * members" the moment they typed — a wall no viewer of a mocked prototype can get
 * past. Here the directory is `MOCK_NETWORK_MEMBERS` plus every hiring team's
 * roster, filtered in memory; a couple of dozen invented rows, so the size
 * argument the live copy makes against client-side search doesn't apply.
 *
 * Debounce kept, and surfaced as `isSearching`, so the menu still shows its
 * "Searching members…" beat instead of answering faster than production ever
 * could. `isUnauthorized` is pinned false — the shape stays that of the live
 * copy, so the two trees are drop-in swappable.
 */
const NETWORK: DirectoryMember[] = MOCK_NETWORK_MEMBERS.map((member) => ({ ...member, image: null }));

const DIRECTORY: DirectoryMember[] = [
  ...Object.entries(MOCK_HIRING_TEAMS).flatMap(([team, members]) =>
    members.map((member) => ({ uid: member.uid, name: member.name, title: member.title, team, image: null })),
  ),
  ...NETWORK,
];

export function useMemberSearch(query: string) {
  const trimmed = query.trim();
  const debounced = useDebounce(trimmed, DEBOUNCE_MS);

  const results = useMemo<DirectoryMember[]>(() => {
    const q = debounced.trim().toLowerCase();
    // Nothing typed: a browse page of the network members, so reaching the drafted
    // note doesn't require knowing a name to type — the referee field opens on
    // these. The live copy can't offer this (its API needs a query and a session).
    // `RecipientPicker` ignores empty-query results, so its resting menu stays the
    // hiring team.
    if (!q) return NETWORK;
    return DIRECTORY.filter((member) => `${member.name} ${member.title} ${member.team}`.toLowerCase().includes(q)).slice(
      0,
      SEARCH_LIMIT,
    );
  }, [debounced]);

  return {
    results,
    /** A keystroke hasn't settled into an answer yet. */
    isSearching: trimmed.length > 0 && trimmed !== debounced,
    hasQuery: trimmed.length > 0,
    /** Never true here — the mock needs no session. Kept for shape parity. */
    isUnauthorized: false,
  };
}
