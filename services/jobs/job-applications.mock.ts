// MOCK: delete at cutover — this entire file is the stand-in backend for in-app
// job applications. The real endpoints do not exist yet; every export here is
// consumed only by the fetcher bodies in `job-applications.service.ts`, so
// cutover is: delete this file, replace those bodies with real transport.

import { JobApplication } from '@/schema/job-applications';
import { isJobSearchStatus, JobSearchStatus } from '@/services/jobs/job-board-viewer';

/**
 * Applied map: in-memory on purpose. Refresh-survival would only make the mock
 * *look* like the server persistence users actually expect — which the real
 * read-back endpoint provides at cutover and a mock cannot honestly fake.
 */
const appliedByMember = new Map<string, JobApplication[]>();

/**
 * Job search status: sessionStorage-backed, and that persistence is
 * load-bearing — the Privy `#login` reload sits inside the profile-completion
 * flow, and an in-memory value would bounce the member back to
 * `profile-incomplete` after every auth round trip.
 */
const STATUS_STORAGE_KEY = 'jobBoard.jobSearchStatus.v1';

/** Blocked-storage browsers throw on ACCESS, so even naming sessionStorage is guarded. */
function storage(): Storage | null {
  try {
    return typeof window === 'undefined' ? null : window.sessionStorage;
  } catch {
    return null;
  }
}

/** Plain Record, never Map — Map JSON-serialises to `{}` silently. */
function readStatusStore(): Record<string, JobSearchStatus> {
  const store = storage();
  if (!store) return {};
  try {
    const parsed: unknown = JSON.parse(store.getItem(STATUS_STORAGE_KEY) ?? '{}');
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    const statuses: Record<string, JobSearchStatus> = {};
    for (const [uid, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (isJobSearchStatus(value)) statuses[uid] = value;
    }
    return statuses;
  } catch {
    return {};
  }
}

const mockLatency = () => new Promise<void>((resolve) => setTimeout(resolve, 350));

export async function mockFetchJobApplications(memberUid: string): Promise<JobApplication[]> {
  await mockLatency();
  return appliedByMember.get(memberUid) ?? [];
}

export class MockAlreadyAppliedError extends Error {
  readonly status = 409;
  constructor() {
    super('Already applied to this role');
  }
}

/**
 * Deterministic failure triggers so every UI path is exercisable by hand:
 *   - a cover letter containing `[[fail]]` rejects like a 500
 *   - a cover letter containing `[[409]]` rejects like a duplicate application
 */
export async function mockSubmitJobApplication(
  memberUid: string,
  input: { roleUid: string; teamUid: string; coverLetter: string },
): Promise<JobApplication> {
  await mockLatency();
  if (input.coverLetter.includes('[[fail]]')) throw new Error('Simulated submit failure');
  const existing = appliedByMember.get(memberUid) ?? [];
  if (input.coverLetter.includes('[[409]]') || existing.some((a) => a.roleUid === input.roleUid)) {
    throw new MockAlreadyAppliedError();
  }
  const application: JobApplication = {
    roleUid: input.roleUid,
    teamUid: input.teamUid,
    appliedAt: new Date().toISOString(),
  };
  appliedByMember.set(memberUid, [...existing, application]);
  return application;
}

export async function mockFetchJobSearchStatus(memberUid: string): Promise<JobSearchStatus | null> {
  await mockLatency();
  return readStatusStore()[memberUid] ?? null;
}

export async function mockUpdateJobSearchStatus(memberUid: string, status: JobSearchStatus): Promise<JobSearchStatus> {
  await mockLatency();
  const store = storage();
  if (store) {
    try {
      store.setItem(STATUS_STORAGE_KEY, JSON.stringify({ ...readStatusStore(), [memberUid]: status }));
    } catch {
      // Quota or blocked mid-session: the in-flight mutation still resolves and
      // the React Query cache carries the value for the rest of the session.
    }
  }
  return status;
}
