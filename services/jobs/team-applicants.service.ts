import {
  ApplicantCount,
  ApplicantKind,
  ApplicantReviewedResult,
  ApplicantSeenResult,
  TeamApplicant,
} from '@/schema/team-applicants';
import {
  mockFetchApplicantCounts,
  mockFetchRoleApplicants,
  mockMarkApplicantSeen,
  mockSetApplicantReviewed,
} from '@/services/jobs/team-applicants.mock';

/**
 * A team's own applicants — the other direction from every other read in this
 * folder, which is scoped to the calling member.
 *
 * **The explicit return types below ARE the contract.** Consumers type against
 * these signatures and never against the mock bodies, so swapping in real
 * transport at cutover cannot silently change a shape. Every body is mock-only
 * today; the real implementations are ordinary authenticated fetches against
 * `DIRECTORY_API_URL`, written the way `job-interests.service.ts` writes them
 * (`customFetch(url, init, true)`, `response?.ok`, `errorFrom`, `JSON_WRITE`).
 *
 * CUTOVER (LAB-2580): delete `team-applicants.mock.ts`, replace the four bodies
 * below with transport, keep `schema/team-applicants.ts` exactly as it is. The
 * schemas were written for the proposed contract, so a server that disagrees
 * fails at the parse rather than three components later — which is the whole
 * point of having written them first.
 */

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
 * Counts for every open role this team has, for the profile's count line and
 * the picker's `● M new`.
 *
 * Counts only — the roles themselves come from the jobs list the profile
 * already fetches. A role absent from the answer has nobody.
 */
export async function fetchApplicantCounts(teamUid: string): Promise<ApplicantCount[]> {
  // MOCK: delete at cutover — real impl: GET /v1/job-openings/teams/{teamUid}/applicant-counts
  return mockFetchApplicantCounts(teamUid);
}

/**
 * One role's two lists, newest first, each row tagged with the list it came
 * from so a row that has lost its envelope still knows what it writes to.
 */
export async function fetchRoleApplicants(
  teamUid: string,
  roleUid: string,
): Promise<{ applications: TeamApplicant[]; interests: TeamApplicant[] }> {
  // MOCK: delete at cutover — real impl: GET /v1/job-openings/teams/{teamUid}/roles/{roleUid}/applicants
  return mockFetchRoleApplicants(teamUid, roleUid);
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
  // MOCK: delete at cutover — real impl:
  // POST /v1/job-openings/{applications|interests}/{uid}/reviewed  { reviewed }
  return mockSetApplicantReviewed(kind, uid, reviewed);
}

/**
 * This viewer has opened this row. Per-lead, so it clears the `● New` tint for
 * them and leaves a co-lead's alone.
 *
 * Fire-and-forget at the call site: a failed `seen` costs a stale badge, which
 * is not worth a rollback or a toast.
 */
export async function markApplicantSeen(kind: ApplicantKind, uid: string): Promise<ApplicantSeenResult> {
  // MOCK: delete at cutover — real impl:
  // POST /v1/job-openings/{applications|interests}/{uid}/seen
  return mockMarkApplicantSeen(kind, uid);
}
