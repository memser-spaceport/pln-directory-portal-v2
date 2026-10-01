'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { JobsQueryKey } from '@/services/jobs/constants';
import {
  clearJobInterest,
  fetchJobInterests,
  JobInterest,
  markJobInterest,
} from '@/services/jobs/job-interests.service';
import type { MemberScopedOptions } from '@/services/types/memberScopedOptions';

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
): { isInterested: boolean; isSettled: boolean; note: string | null } {
  const { data, isPending, isError } = useQuery({
    queryKey: jobInterestsQueryKey(memberUid ?? ''),
    queryFn: fetchJobInterests,
    enabled: enabled && !!memberUid,
    staleTime: Infinity,
    /* The row rather than a boolean, since LAB-2713: the banner quotes the
       note back, and the note lives on the row. Still one observer per banner,
       still re-rendering only when this role's row changes. */
    select: (interests: JobInterest[]) => interests.find((interest) => interest.jobUid === roleUid) ?? null,
  });

  /* The Jest `useQuery` mock ignores `select` and returns the raw object, so
     this is a shape test rather than a truthiness one — the same guard, for
     the same reason, as `useIsRoleApplied`. */
  const row =
    data && typeof data === 'object' && (data as JobInterest).jobUid === roleUid ? (data as JobInterest) : null;

  return {
    isInterested: row !== null,
    note: row?.note ?? null,
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
    /* Both verbs answer with the same shape — the authoritative post-write
       state — which is what lets `onSuccess` below correct the screen from the
       server's answer rather than from what we assumed the press meant. */
    mutationFn: ({ roleUid, nextInterested, note }: { roleUid: string; nextInterested: boolean; note?: string }) =>
      nextInterested ? markJobInterest(roleUid, note) : clearJobInterest(roleUid),

    onMutate: async ({ roleUid, nextInterested, note }): Promise<{ previous?: JobInterest[] }> => {
      if (!memberUid) return {};
      const key = jobInterestsQueryKey(memberUid);

      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<JobInterest[]>(key);

      /* The note as the server will keep it: trimmed, and absent when blank. */
      const trimmedNote = note?.trim() || null;

      queryClient.setQueryData<JobInterest[]>(key, (old = []) => {
        if (!nextInterested) return old.filter((interest) => interest.jobUid !== roleUid);
        /* A repeat press with a note replaces the stored one (LAB-2726), so the
           row's note follows the press even when the row already exists. */
        if (old.some((interest) => interest.jobUid === roleUid)) {
          return old.map((interest) => (interest.jobUid === roleUid ? { ...interest, note: trimmedNote } : interest));
        }
        /* A stand-in row, not a guess at the server's. Only `jobUid` and `note`
           are ever read from it before `onSettled` replaces the list wholesale;
           the uid is marked so a row that somehow outlives the refetch is
           obvious in a devtools cache dump rather than passing for real. */
        return [
          ...old,
          { uid: `optimistic:${roleUid}`, jobUid: roleUid, interestedAt: new Date().toISOString(), note: trimmedNote },
        ];
      });

      return { previous };
    },

    /* The server's answer, not our assumption. Both writes are idempotent, so
       in practice `viewerIsInterested` agrees with the press that caused it —
       but it is the only thing here that actually knows, and taking it costs
       one branch. A disagreement means something raced us, and the screen
       should follow the server rather than the click. */
    onSuccess: (result, { note }) => {
      if (!memberUid) return;
      queryClient.setQueryData<JobInterest[]>(jobInterestsQueryKey(memberUid), (old = []) => {
        const without = old.filter((interest) => interest.jobUid !== result.jobUid);
        if (!result.viewerIsInterested) return without;
        const existing = old.find((interest) => interest.jobUid === result.jobUid);
        return [
          ...without,
          existing ?? {
            uid: `pending:${result.jobUid}`,
            jobUid: result.jobUid,
            interestedAt: new Date().toISOString(),
            note: result.note ?? note?.trim() ?? null,
          },
        ];
      });
    },

    onError: (_error, _variables, context) => {
      if (!memberUid) return;
      if (context?.previous !== undefined) {
        queryClient.setQueryData(jobInterestsQueryKey(memberUid), context.previous);
      }
    },

    /* The row this hook synthesises above carries a placeholder `uid` and a
       client clock. Nothing reads either — the map is only ever asked "is this
       jobUid in here" — but the refetch replaces them with the real row, so the
       cache does not keep a fiction around longer than one round trip. */
    onSettled: () => {
      if (!memberUid) return;
      queryClient.invalidateQueries({ queryKey: jobInterestsQueryKey(memberUid) });
    },
  });
}
