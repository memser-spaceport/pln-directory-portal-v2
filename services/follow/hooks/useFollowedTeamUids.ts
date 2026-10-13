'use client';

import { useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { getFollowedTeams } from '../follow.service';
import type { MemberScopedOptions } from '@/services/types/memberScopedOptions';

/**
 * The followed-team set, built the same way as the applied/interested maps
 * (`useJobApplications`, `useJobInterests`) and for the same reasons: the
 * universe ("teams this member follows") is fully known server-side, so
 * cache-absence = not-followed is safe. Keys are member-scoped because the
 * module-scope QueryClient survives auth changes.
 */

export const followedTeamUidsQueryKey = (memberUid: string) => ['followed-team-uids', memberUid] as const;

/* The endpoint caps a page at 200, so a member who follows more than that
   needs the pages walked. A failed page ends the walk with what is known —
   follow writes are idempotent, so a stale "not followed" read is safe. */
async function fetchFollowedTeamUids(): Promise<string[]> {
  const uids: string[] = [];
  let page = 1;
  let totalPages = 1;
  while (page <= totalPages) {
    const result = await getFollowedTeams(page);
    if (!result) break;
    for (const team of result.items) uids.push(team.uid);
    totalPages = Math.ceil(result.total / result.limit) || 1;
    page += 1;
  }
  return uids;
}

export function useFollowedTeamUids({ memberUid, enabled }: MemberScopedOptions): {
  followedTeamUids: Set<string>;
  isSettled: boolean;
} {
  const { data, isPending, isError } = useQuery({
    queryKey: followedTeamUidsQueryKey(memberUid ?? ''),
    queryFn: fetchFollowedTeamUids,
    enabled: enabled && !!memberUid,
    staleTime: Infinity,
  });

  return {
    /* The Jest useQuery mock returns its own object, so this is a shape test —
       the same guard as `useIsRoleApplied`. */
    followedTeamUids: useMemo(() => new Set(Array.isArray(data) ? data : []), [data]),
    /* Same contract as `useRoleInterest`: only a genuinely in-flight first read
       is unsettled, so a caller hiding a control until this is true does not
       wait forever on a disabled or failed query. */
    isSettled: !isPending || isError || !enabled || !memberUid,
  };
}

/** Record a just-made follow in the cache, so the next surface asking "does
 *  this member follow this team" answers without a refetch. */
export function useRememberTeamFollowed(memberUid: string | undefined) {
  const queryClient = useQueryClient();
  return useCallback(
    (teamUid: string) => {
      if (!memberUid) return;
      queryClient.setQueryData<string[]>(followedTeamUidsQueryKey(memberUid), (old) =>
        old && !old.includes(teamUid) ? [...old, teamUid] : old,
      );
    },
    [queryClient, memberUid],
  );
}
