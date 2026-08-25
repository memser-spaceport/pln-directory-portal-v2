import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { JobsQueryKey } from '@/services/jobs/constants';
import {
  fetchJobApplications,
  isAlreadyAppliedError,
  JobApplication,
  submitJobApplication,
} from '@/services/jobs/job-applications.service';

/**
 * The applied map is ONE whole-list query — the universe ("roles this viewer
 * applied to") is fully known server-side, so a complete list makes
 * cache-absence = not-applied safe, and lets the team-profile host (feature
 * phase 2) read the same entry without ever having seen the board.
 *
 * Keys are member-scoped: the module-scope QueryClient survives client-side
 * auth changes, and an unscoped key at `staleTime: Infinity` would serve user
 * A's applied rows to user B after re-login in the same tab.
 *
 * None of these hooks import the feature flag — callers pass `enabled`, which
 * in practice is "the apply props exist" (prop-absence is the flag gate).
 */

export const jobApplicationsQueryKey = (memberUid: string) => [JobsQueryKey.ApplicationStatuses, memberUid] as const;

interface MemberScopedOptions {
  memberUid: string | undefined;
  enabled: boolean;
}

export function useJobApplications({ memberUid, enabled }: MemberScopedOptions) {
  return useQuery<JobApplication[]>({
    queryKey: jobApplicationsQueryKey(memberUid ?? ''),
    queryFn: fetchJobApplications,
    enabled: enabled && !!memberUid,
    staleTime: Infinity,
  });
}

/**
 * Per-row subscription: `select` narrows to this row's boolean, so one
 * application re-renders exactly the applied row, never the whole infinite
 * list. All rows share the map query's key — N observers, one fetch.
 *
 * The board calls it a role uid; the API calls the same identifier `jobUid`.
 */
export function useIsRoleApplied(roleUid: string, { memberUid, enabled }: MemberScopedOptions): boolean {
  const { data } = useQuery({
    queryKey: jobApplicationsQueryKey(memberUid ?? ''),
    queryFn: fetchJobApplications,
    enabled: enabled && !!memberUid,
    staleTime: Infinity,
    select: (applications: JobApplication[]) => applications.some((application) => application.jobUid === roleUid),
  });
  // The Jest useQuery mock ignores `select` and returns the raw object — guard
  // the type so tests exercise the same code path production runs.
  return data === true;
}

/**
 * The same per-row subscription, narrowed to the application itself rather than
 * a boolean — for the surfaces that also need to say *when*.
 *
 * Both the row's clock ("Applied 3d ago" instead of the posting's age) and the
 * detail drawer's footer read the date, and deriving it from a second source
 * would let the two disagree about the same application. Shares the map's key,
 * so this is another observer on one fetch rather than another request.
 */
export function useRoleApplication(roleUid: string, { memberUid, enabled }: MemberScopedOptions) {
  const { data } = useQuery({
    queryKey: jobApplicationsQueryKey(memberUid ?? ''),
    queryFn: fetchJobApplications,
    enabled: enabled && !!memberUid,
    staleTime: Infinity,
    select: (applications: JobApplication[]) =>
      applications.find((application) => application.jobUid === roleUid) ?? null,
  });

  /* Same guard as `useIsRoleApplied`, same reason: the repo's global `useQuery`
     mock ignores `select` and hands back its own object, so a shape test — not
     a truthiness test — is what keeps tests on production's code path. */
  return data && typeof data === 'object' && 'jobUid' in data ? (data as JobApplication) : null;
}

export function useSubmitJobApplication(memberUid: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ roleUid, coverLetter }: { roleUid: string; coverLetter: string }) =>
      submitJobApplication(roleUid, { coverLetter }),
    onSuccess: (application) => {
      if (!memberUid) return;
      // Write-through, not invalidate-and-refetch: the submit response is the
      // authoritative record, and a refetch round-trip would leave a window
      // where the row still offers Apply after a successful submit.
      queryClient.setQueryData<JobApplication[]>(jobApplicationsQueryKey(memberUid), (previous = []) =>
        previous.some((existing) => existing.jobUid === application.jobUid) ? previous : [...previous, application],
      );
    },
    onError: (error) => {
      if (!memberUid || !isAlreadyAppliedError(error)) return;
      // The server already holds this application — refetch the authoritative
      // list so the row flips to Applied instead of erroring about it.
      queryClient.invalidateQueries({ queryKey: jobApplicationsQueryKey(memberUid) });
    },
  });
}
