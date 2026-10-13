'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { ApplicantCount, ApplicantKind, TeamApplicant } from '@/schema/team-applicants';
import { JobsQueryKey } from '@/services/jobs/constants';
import {
  fetchApplicantCounts,
  fetchRoleApplicants,
  markApplicantSeen,
  setApplicantReviewed,
} from '@/services/jobs/team-applicants.service';

/**
 * The team-side reads: how many people answered each role, and who they are.
 *
 * **Keys are scoped by the VIEWER, not just the team.** `unseen` is per-lead, so
 * two leads of the same team hold genuinely different answers for the same
 * team uid — and the `QueryClient` is a module-scope singleton that survives a
 * client-side re-login, so an unscoped key would hand one lead the other's
 * unread state after a re-login in the same tab.
 *
 * **None of these hooks import the feature flag.** Callers pass `enabled`, per
 * the rule in `services/jobs/constants.ts`: gate the work, not the render.
 * `enabled` here is doing more than saving a request — every call is
 * authenticated, and `customFetch` answers a missing session by logging out and
 * calling `window.location.reload()`. An ungated authenticated query on a page
 * a signed-out visitor can reach is not a failed fetch, it is a reload loop. A
 * host early-return cannot gate a hook; only `enabled` can.
 */

export const applicantCountsQueryKey = (viewerUid: string, teamUid: string) =>
  [JobsQueryKey.TeamApplicantCounts, viewerUid, teamUid] as const;

export const roleApplicantsQueryKey = (viewerUid: string, teamUid: string, roleUid: string) =>
  [JobsQueryKey.RoleApplicants, viewerUid, teamUid, roleUid] as const;

interface ViewerScoped {
  teamUid: string;
  /** The signed-in lead. Undefined means no session, which disables every query. */
  viewerUid: string | undefined;
  enabled: boolean;
}

/**
 * Counts for all of the team's roles, in one read.
 *
 * One whole-list query rather than one per role: the count line renders inside
 * a `memo`'d row list, and N subscriptions there would be N fetches and N more
 * reasons for that memo to miss. The host reads the array and hands each row
 * its own numbers.
 */
export function useApplicantCounts({ teamUid, viewerUid, enabled }: ViewerScoped) {
  return useQuery<ApplicantCount[]>({
    queryKey: applicantCountsQueryKey(viewerUid ?? '', teamUid),
    queryFn: () => fetchApplicantCounts(teamUid),
    enabled: enabled && !!viewerUid && !!teamUid,
    staleTime: 30_000,
  });
}

/**
 * One role's two lists.
 *
 * `refetchOnWindowFocus` is off deliberately: a lead reading an application
 * alt-tabs to their mail client to reply, and a refetch on the way back would
 * re-sort the list under the person they were on. The counts query keeps its
 * default, because a stale badge is worth correcting and nobody is mid-read in
 * it.
 */
export function useRoleApplicants({
  teamUid,
  roleUid,
  viewerUid,
  enabled,
}: ViewerScoped & { roleUid: string | undefined }) {
  return useQuery<{ applications: TeamApplicant[]; interests: TeamApplicant[] }>({
    queryKey: roleApplicantsQueryKey(viewerUid ?? '', teamUid, roleUid ?? ''),
    queryFn: () => fetchRoleApplicants(teamUid, roleUid as string),
    enabled: enabled && !!viewerUid && !!teamUid && !!roleUid,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}

/** Both lists as one array — what the row list and the prev/next bar walk. */
const allRows = (data?: { applications: TeamApplicant[]; interests: TeamApplicant[] }): TeamApplicant[] =>
  data ? [...data.applications, ...data.interests] : [];

function patchRow(
  queryClient: ReturnType<typeof useQueryClient>,
  key: readonly unknown[],
  uid: string,
  patch: Partial<TeamApplicant>,
) {
  queryClient.setQueryData<{ applications: TeamApplicant[]; interests: TeamApplicant[] }>(key, (old) => {
    if (!old) return old;
    const apply = (rows: TeamApplicant[]) => rows.map((row) => (row.uid === uid ? { ...row, ...patch } : row));
    return { applications: apply(old.applications), interests: apply(old.interests) };
  });
}

/**
 * The team's tick. Optimistic, because the press is a bookkeeping mark and any
 * in-flight state would be longer than the thought behind it.
 *
 * Shape follows `useToggleJobInterest`: cancel, snapshot, patch, reconcile from
 * the server's answer on success, restore on failure, invalidate on settle.
 */
export function useToggleApplicantReviewed({
  teamUid,
  roleUid,
  viewerUid,
}: {
  teamUid: string;
  roleUid: string | undefined;
  viewerUid: string | undefined;
}) {
  const queryClient = useQueryClient();
  const key = roleApplicantsQueryKey(viewerUid ?? '', teamUid, roleUid ?? '');

  return useMutation({
    mutationFn: ({ kind, uid, reviewed }: { kind: ApplicantKind; uid: string; reviewed: boolean }) =>
      setApplicantReviewed(kind, uid, reviewed),

    onMutate: async ({ uid, reviewed }) => {
      if (!viewerUid || !roleUid) return {};
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData(key);
      patchRow(queryClient, key, uid, { reviewed });
      return { previous };
    },

    /* The server's answer, not the press. Both directions are idempotent, so in
       practice they agree — but a disagreement means something raced us, and
       the screen should follow the server rather than the click. */
    onSuccess: (result) => {
      if (!viewerUid || !roleUid) return;
      patchRow(queryClient, key, result.uid, { reviewed: result.reviewed });
    },

    onError: (_error, _variables, context) => {
      if (!viewerUid || !roleUid) return;
      if (context?.previous !== undefined) {
        queryClient.setQueryData(key, context.previous);
      }
    },

    onSettled: () => {
      if (!viewerUid || !roleUid) return;
      queryClient.invalidateQueries({ queryKey: key });
    },
  });
}

/**
 * "This lead has opened this row."
 *
 * Fire-and-forget, and the only write here with no rollback: a failed `seen`
 * costs a tint that comes back on the next read, which is not worth a toast or
 * a restored snapshot.
 *
 * It patches the counts cache directly rather than invalidating it. Stepping
 * through twenty applicants with prev/next fires twenty of these, and twenty
 * invalidations would be twenty refetches of a number that this hook already
 * knows how to decrement.
 */
export function useMarkApplicantSeen({
  teamUid,
  roleUid,
  viewerUid,
}: {
  teamUid: string;
  roleUid: string | undefined;
  viewerUid: string | undefined;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ kind, uid }: { kind: ApplicantKind; uid: string }) => markApplicantSeen(kind, uid),

    onMutate: ({ uid }) => {
      if (!viewerUid || !roleUid) return;

      const rowsKey = roleApplicantsQueryKey(viewerUid, teamUid, roleUid);
      const wasUnseen = allRows(queryClient.getQueryData(rowsKey)).find((row) => row.uid === uid)?.unseen;
      patchRow(queryClient, rowsKey, uid, { unseen: false });

      /* Only a row that WAS unseen moves the badge. Re-selecting someone you
         already opened must not walk the count down past zero. */
      if (!wasUnseen) return;

      queryClient.setQueryData<ApplicantCount[]>(applicantCountsQueryKey(viewerUid, teamUid), (old) =>
        old?.map((count) =>
          count.roleUid === roleUid ? { ...count, newCount: Math.max(0, count.newCount - 1) } : count,
        ),
      );
    },
  });
}
