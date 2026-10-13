import {
  ApplicantCount,
  applicantCountsResponseSchema,
  ApplicantKind,
  ApplicantReviewedResult,
  applicantReviewedResponseSchema,
  ApplicantSeenResult,
  applicantSeenResponseSchema,
  roleApplicantsResponseSchema,
  TeamApplicant,
} from '@/schema/team-applicants';
import { customFetch } from '@/utils/fetch-wrapper';

/**
 * A team's own applicants — the other direction from every other read in this
 * folder, which is scoped to the calling member.
 *
 * **The explicit return types below ARE the contract**, and they survived the
 * cutover unchanged: this shipped mocked behind `SHOW_TEAM_APPLICANTS` while the
 * endpoints were written to these same schemas (backend #3438, LAB-2580), so
 * swapping the transport in touched no consumer and no component.
 *
 * The schemas still parse every response. A server that drifts from them fails
 * here rather than three components later — which is why they were written
 * first, and why they stay now that there is a real server behind them.
 */

const JOB_OPENINGS_API_URL = `${process.env.DIRECTORY_API_URL}/v1/job-openings`;

/**
 * The URL's spelling of a row's kind.
 *
 * The API routes on `applications` / `interests`; the app says `application` /
 * `interest`, because a single row is one of them. One mapping, here, rather
 * than a plural leaking into the UI's vocabulary to save a function.
 */
const KIND_PATH: Record<ApplicantKind, string> = {
  application: 'applications',
  interest: 'interests',
};

/**
 * A write with a JSON content type and an empty body, for endpoints that take
 * none.
 *
 * Not ceremony — it is the fix for a real 415. `customFetch` adds
 * `Authorization` and nothing else, so a bodyless POST goes out with no
 * `Content-Type` and the API's validation layer answers "Unsupported Content
 * Type" before the handler runs. `job-interests.service.ts` carries the same
 * note and the same shape.
 */
const jsonWrite = (body: unknown = {}) => ({
  method: 'POST' as const,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

export type { ApplicantCount, ApplicantKind, TeamApplicant };

/**
 * A refusal from the applicants endpoints.
 *
 * Its own class rather than a reuse of `JobInterestError`, for the reason that
 * one gives about `JobApplicationError`: callers tell them apart with
 * `instanceof`, and these two failures mean different things. This is the third
 * such class in the folder — at a fourth, lift the body reading into a shared
 * `job-openings-error` module rather than copying it again.
 */
export class TeamApplicantsError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'TeamApplicantsError';
    this.status = status;
  }
}

/** The lead is not a lead of this team (or not an admin). */
export const isApplicantsForbiddenError = (error: unknown): boolean =>
  error instanceof TeamApplicantsError && error.status === 403;

/**
 * The server's own message, when it sent one worth reading.
 *
 * `customFetch` resolves to `undefined` when it gives up and logs the session
 * out — there is no response to read and the reload it triggers is already under
 * way, so this only has to not throw on the way there.
 */
async function errorFrom(response: Response | undefined, fallback: string): Promise<TeamApplicantsError> {
  if (!response) {
    return new TeamApplicantsError(401, 'Your session expired. Sign in and try again.');
  }

  let message = fallback;
  try {
    const body = await response.json();
    const serverMessage = body?.message ?? body?.status?.message;
    if (typeof serverMessage === 'string' && serverMessage.trim()) {
      message = serverMessage;
    }
  } catch {
    // A body we can't read is not worth failing differently over.
  }
  return new TeamApplicantsError(response.status, message);
}

/**
 * Counts for every open role this team has, for the profile's count line and
 * the picker's `● M new`.
 *
 * Counts only — the roles themselves come from the jobs list the profile
 * already fetches. A role absent from the answer has nobody.
 */
export async function fetchApplicantCounts(teamUid: string): Promise<ApplicantCount[]> {
  const response = await customFetch(
    `${JOB_OPENINGS_API_URL}/teams/${encodeURIComponent(teamUid)}/applicant-counts`,
    { method: 'GET' },
    true,
  );

  if (!response?.ok) {
    throw await errorFrom(response, 'Could not load applicant counts');
  }

  return applicantCountsResponseSchema.parse(await response.json()).counts;
}

/**
 * One role's two lists, newest first, each row tagged with the list it came
 * from so a row that has lost its envelope still knows what it writes to.
 */
export async function fetchRoleApplicants(
  teamUid: string,
  roleUid: string,
): Promise<{ applications: TeamApplicant[]; interests: TeamApplicant[] }> {
  const response = await customFetch(
    `${JOB_OPENINGS_API_URL}/teams/${encodeURIComponent(teamUid)}/roles/${encodeURIComponent(roleUid)}/applicants`,
    { method: 'GET' },
    true,
  );

  if (!response?.ok) {
    throw await errorFrom(response, 'Could not load applicants');
  }

  const { applications, interests } = roleApplicantsResponseSchema.parse(await response.json());

  /* `kind` is the app's, not the wire's: the API answers two named arrays, and a
     row that leaves its array — into the pane, into a `seen` write — has to keep
     knowing which one it came from. */
  return {
    applications: applications.map((row) => ({ ...row, kind: 'application' as const })),
    interests: interests.map((row) => ({ ...row, kind: 'interest' as const })),
  };
}

/**
 * The team's tick, both directions through one call.
 *
 * Idempotent and it answers with the post-write state, so the caller corrects
 * the screen from the server rather than from what it assumed the press meant.
 */
export async function setApplicantReviewed(
  kind: ApplicantKind,
  uid: string,
  reviewed: boolean,
): Promise<ApplicantReviewedResult> {
  const response = await customFetch(
    `${JOB_OPENINGS_API_URL}/${KIND_PATH[kind]}/${encodeURIComponent(uid)}/reviewed`,
    jsonWrite({ reviewed }),
    true,
  );

  if (!response?.ok) {
    throw await errorFrom(response, 'Could not update this applicant');
  }

  return applicantReviewedResponseSchema.parse(await response.json());
}

/**
 * This viewer has opened this row. Per-lead, so it clears the `● New` tint for
 * them and leaves a co-lead's alone.
 *
 * Fire-and-forget at the call site: a failed `seen` costs a stale badge, which
 * is not worth a rollback or a toast.
 */
export async function markApplicantSeen(kind: ApplicantKind, uid: string): Promise<ApplicantSeenResult> {
  const response = await customFetch(
    `${JOB_OPENINGS_API_URL}/${KIND_PATH[kind]}/${encodeURIComponent(uid)}/seen`,
    jsonWrite(),
    true,
  );

  if (!response?.ok) {
    throw await errorFrom(response, 'Could not mark this applicant as read');
  }

  return applicantSeenResponseSchema.parse(await response.json());
}
