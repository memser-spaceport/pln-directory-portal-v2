import {
  JobApplication,
  jobApplicationSchema,
  jobApplicationsResponseSchema,
  SubmitJobApplicationInput,
  submitJobApplicationInputSchema,
} from '@/schema/job-applications';
import {
  mockFetchJobApplications,
  mockFetchJobSearchStatus,
  mockSubmitJobApplication,
  mockUpdateJobSearchStatus,
} from '@/services/jobs/job-applications.mock';
import { JobSearchStatus } from '@/services/jobs/job-board-viewer';

/**
 * In-app job applications + the (PL-Team-only) job search status.
 *
 * The explicit return types on these fetchers ARE the contract — consumers type
 * against the signatures, never against the mock bodies, so swapping in the
 * real transport at cutover cannot silently change a shape. Every body below is
 * mock-only and client-only (`sessionStorage` inside); the real implementations
 * will be ordinary authenticated fetches against DIRECTORY_API_URL.
 *
 * NOTE for cutover: `fetchJobSearchStatus`/`updateJobSearchStatus` live here
 * provisionally — the field is member-profile state and is expected to migrate
 * to the members service once it has a backend home.
 */

export type { JobApplication, SubmitJobApplicationInput };

export async function fetchJobApplications(memberUid: string): Promise<JobApplication[]> {
  // MOCK: delete at cutover — real impl: GET /v1/members/{uid}/job-applications
  const applications = await mockFetchJobApplications(memberUid);
  return jobApplicationsResponseSchema.parse(applications);
}

export async function submitJobApplication(
  memberUid: string,
  input: SubmitJobApplicationInput,
): Promise<JobApplication> {
  const payload = submitJobApplicationInputSchema.parse(input);
  // MOCK: delete at cutover — real impl: POST /v1/members/{uid}/job-applications
  // (server must 403 non-approved members, validate the role uid, and 409 duplicates)
  const application = await mockSubmitJobApplication(memberUid, payload);
  return jobApplicationSchema.parse(application);
}

export async function fetchJobSearchStatus(memberUid: string): Promise<JobSearchStatus | null> {
  // MOCK: delete at cutover — real read comes with the member record or a
  // dedicated endpoint; validate with isJobSearchStatus so a server that drops
  // the field fails loudly on every read, not silently at the gate.
  return mockFetchJobSearchStatus(memberUid);
}

export async function updateJobSearchStatus(memberUid: string, status: JobSearchStatus): Promise<JobSearchStatus> {
  // MOCK: delete at cutover — real impl PATCHes the member record; cutover
  // requires the read-after-write check (non-strict APIs accept-and-drop
  // unknown fields, and this field has no backend home yet).
  return mockUpdateJobSearchStatus(memberUid, status);
}

/** True when a submit failure means "already applied" — the row should flip to Applied, not error. */
export function isAlreadyAppliedError(error: unknown): boolean {
  return !!error && typeof error === 'object' && (error as { status?: number }).status === 409;
}
