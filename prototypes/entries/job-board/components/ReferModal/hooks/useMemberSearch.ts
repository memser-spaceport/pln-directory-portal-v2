'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import { useDebounce } from '@/hooks/useDebounce';

import { DirectoryMember } from '../types';

const SEARCH_LIMIT = 15;
const DEBOUNCE_MS = 300;

/** One page of matches, or the fact that the caller isn't signed in. */
interface SearchPage {
  items: any[];
  unauthorized: boolean;
}

/** One `/api/members-search` item as the pickers render it. The route already flattens
 *  the directory record: `id`, `profile` for the avatar, `mainTeam` for the role · team
 *  line, with `role` as the member's own title when they have no main team. */
function toDirectoryMember(item: any): DirectoryMember {
  return {
    uid: item?.id,
    name: item?.name ?? '',
    title: item?.mainTeam?.role || item?.role || item?.teams?.[0]?.role || '',
    team: item?.mainTeam?.name || item?.teams?.[0]?.name || '',
    image: item?.profile ?? null,
    skills: (item?.skills ?? []).map((skill: any) => skill?.title).filter(Boolean),
  };
}

/**
 * Members matching what's being typed, debounced and capped.
 *
 * `/api/members-search` — the Next route over the directory's `/v1/members-search` —
 * is the search built for this: it ranks matches server-side, attaches the caller's
 * auth token, and returns one page. The alternative was holding the whole network in
 * memory and letting each select filter it, which measured badly: 2.8k members is
 * ~640KB and ~2s before the field answers at all, and react-select mounts every
 * matching row (each with a generated avatar), so a one-letter query would render
 * hundreds of them. A 15-row page keeps both menus small whatever is typed.
 *
 * Not `services/members/hooks/useMembersSearch` — it calls this same route, but maps
 * away the role and team-role fields these pickers show under a name.
 */
export function useMemberSearch(query: string) {
  const trimmed = query.trim();
  const debounced = useDebounce(trimmed, DEBOUNCE_MS);

  const { data, isFetching } = useQuery<SearchPage>({
    queryKey: ['prototype', 'job-board', 'refer-modal', 'member-search', debounced],
    queryFn: async () => {
      const response = await fetch(
        `/api/members-search?search=${encodeURIComponent(debounced)}&page=1&limit=${SEARCH_LIMIT}`,
      );

      // The route requires a session — without a token it would be an open member
      // enumeration endpoint. Returned as a state rather than thrown: signed out is a
      // situation the field can explain, and throwing would log a failed query (and
      // retry it) on every keystroke for something no retry can fix.
      if (response.status === 401) {
        return { items: [], unauthorized: true };
      }

      if (!response.ok) {
        throw new Error('Member search failed');
      }

      const json = await response.json();

      return { items: (json?.items ?? []) as any[], unauthorized: false };
    },
    enabled: debounced.length > 0,
    // Hold the previous page on screen while the next one lands, so the menu doesn't
    // blink through an empty state on every keystroke.
    placeholderData: (previous) => previous,
    staleTime: 60 * 1000,
  });

  const results = useMemo<DirectoryMember[]>(
    () => (data?.items ?? []).map(toDirectoryMember).filter((member) => !!member.uid && !!member.name),
    [data],
  );

  return {
    results: debounced.length > 0 ? results : [],
    /** A request is out, or a keystroke hasn't settled into one yet. */
    isSearching: trimmed.length > 0 && (trimmed !== debounced || isFetching),
    hasQuery: trimmed.length > 0,
    /** Signed out. The field says so rather than claiming nobody matched. */
    isUnauthorized: !!data?.unauthorized,
  };
}
