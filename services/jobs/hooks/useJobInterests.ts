'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { JobsQueryKey } from '@/services/jobs/constants';
import {
  clearJobInterest,
  fetchJobInterests,
  isAlreadyInterestedError,
  JobInterest,
  markJobInterest,
} from '@/services/jobs/job-interests.service';

/**
 * The interested map, built the same way as the applied map next door
 * (`useJobApplications`) and for the same three reasons.
 *
 * ONE whole-list query: the universe ("roles this viewer marked") is fully known
 * server-side, so a complete list makes cache-absence = not-interested safe, and
 * the team-profile host reads the same entry without ever having seen the board.
 *
 * Keys are member-scoped: the module-scope `QueryClient` survives client-side
 * auth changes, and an unscoped key at `staleTime: Infinity` would serve user
 * A's interested rows to user B after a re-login in the same tab.
 *
 * None of these hooks import the feature flag — callers pass `enabled`.
 */

export const jobInterestsQueryKey = (memberUid: string) => [JobsQueryKey.InterestStatuses, memberUid] as const;

interface MemberScopedOptions {
  memberUid: string | undefined;
  enabled: boolean;
}

export function useJobInterests({ memberUid, enabled }: MemberScopedOptions) {
  return useQuery<JobInterest[]>({
    queryKey: jobInterestsQueryKey(memberUid ?? ''),
    queryFn: fetchJobInterests,
    enabled: enabled && !!memberUid,
    staleTime: Infinity,
  });
}

/**
 * Per-banner subscription: `select` narrows to this role's boolean, so a toggle
 * re-renders exactly the open drawer's banner. All readers share the map's key —
 * N observers, one fetch.
 *
 * `isSettled` rides along because the banner must not paint its default state
 * before the answer is known: an already-interested member would otherwise see
 * the blue CTA flip to green a beat after first paint. `deriveBoardViewer` grew
 * a whole `resolving` state for that same flash; this is the cheap version of
 * the same rule.
 */
export function useRoleInterest(
  roleUid: string,
  { memberUid, enabled }: MemberScopedOptions,
): { isInterested: boolean; isSettled: boolean } {
  const { data, isPending, isError } = useQuery({
    queryKey: jobInterestsQueryKey(memberUid ?? ''),
    queryFn: fetchJobInterests,
    enabled: enabled && !!memberUid,
    staleTime: Infinity,
    select: (interests: JobInterest[]) => interests.some((interest) => interest.jobUid === roleUid),
  });

  return {
    /* The Jest `useQuery` mock ignores `select` and returns the raw object, so
       this is a shape test rather than a truthiness one — the same guard, for
       the same reason, as `useIsRoleApplied`. */
    isInterested: data === true,
    /* A query that is disabled never pends, and a failed one is settled at
       "we asked and could not find out" — in both cases the banner should show
       rather than wait forever. Only a genuinely in-flight first read holds it
       back. */
    isSettled: !isPending || isError || !enabled || !memberUid,
  };
}

/**
 * The toggle. Optimistic, because the press has to land instantly — the whole
 * proposition of a light signal is that it costs nothing — and because being
 * optimistic is what removes the in-flight state the design never drew.
 *
 * Shape follows `useGantryUpvote`: cancel, snapshot, patch, restore on failure,
 * invalidate on settle.
 */
export function useToggleJobInterest(memberUid: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    /* Returns nothing on purpose. The POST answers with the created row, but
       reading it here would make the two arms of this toggle differently
       shaped for no gain: `onSettled` refetches the authoritative list either
       way, and the optimistic patch is what the screen is actually drawn from. */
    mutationFn: async ({ roleUid, nextInterested }: { roleUid: string; nextInterested: boolean }): Promise<void> => {
      if (nextInterested) {
        await markJobInterest(roleUid);
        return;
      }
      await clearJobInterest(roleUid);
    },

    onMutate: async ({ roleUid, nextInterested }): Promise<{ previous?: JobInterest[] }> => {
      if (!memberUid) return {};
      const key = jobInterestsQueryKey(memberUid);

      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<JobInterest[]>(key);

      queryClient.setQueryData<JobInterest[]>(key, (old = []) => {
        if (!nextInterested) return old.filter((interest) => interest.jobUid !== roleUid);
        if (old.some((interest) => interest.jobUid === roleUid)) return old;
        /* A stand-in row, not a guess at the server's. Only `jobUid` is ever
           read from it before `onSettled` replaces the list wholesale; the uid
           is marked so a row that somehow outlives the refetch is obvious in a
           devtools cache dump rather than passing for real. */
        return [...old, { uid: `optimistic:${roleUid}`, jobUid: roleUid, createdAt: new Date().toISOString() }];
      });

      return { previous };
    },

    onError: (error, _variables, context) => {
      if (!memberUid) return;
      /* A 409 says the server already holds what we just optimistically wrote —
         the state is the one the person asked for, so rolling back would undo a
         correct screen. Let `onSettled` refetch instead. */
      if (isAlreadyInterestedError(error)) return;
      if (context?.previous !== undefined) {
        queryClient.setQueryData(jobInterestsQueryKey(memberUid), context.previous);
      }
    },

    onSettled: () => {
      if (!memberUid) return;
      queryClient.invalidateQueries({ queryKey: jobInterestsQueryKey(memberUid) });
    },
  });
}
