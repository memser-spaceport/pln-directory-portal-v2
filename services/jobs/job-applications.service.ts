import {
  JobApplication,
  jobApplicationListResponseSchema,
  jobApplicationSchema,
  JobBoardSignUpInput,
  jobBoardSignUpInputSchema,
  jobBoardSignUpResponseSchema,
  SubmitJobApplicationInput,
  submitJobApplicationInputSchema,
} from '@/schema/job-applications';
import { customFetch } from '@/utils/fetch-wrapper';

const JOB_OPENINGS_API_URL = `${process.env.DIRECTORY_API_URL}/v1/job-openings`;

export type { JobApplication, SubmitJobApplicationInput, JobBoardSignUpInput };

/**
 * A refusal from the apply/sign-up endpoints, carrying the status so callers
 * can tell the cases apart. The distinctions matter to the person: "your
 * account isn't approved yet", "this job is gone" and "we couldn't reach
 * anyone at this team" are three different situations, and only one of them is
 * worth retrying.
 */
export class JobApplicationError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'JobApplicationError';
    this.status = status;
  }
}

/**
 * The server's own message, when it sent one worth reading.
 *
 * `customFetch` resolves to `undefined` when it gives up and logs the session
 * out — there is no response to read, and the reload it triggers is already
 * under way, so this only needs to not throw on the way there.
 */
async function errorFrom(response: Response | undefined, fallback: string): Promise<JobApplicationError> {
  if (!response) {
    return new JobApplicationError(401, 'Your session expired. Sign in and try again.');
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
  return new JobApplicationError(response.status, message);
}

/**
 * Every role this member has applied to. One whole-list read: the universe is
 * known server-side, so a uid absent from the response means not applied
 * rather than not-yet-known.
 */
export async function fetchJobApplications(): Promise<JobApplication[]> {
  const response = await customFetch(`${JOB_OPENINGS_API_URL}/applications`, { method: 'GET' }, true);

  if (!response?.ok) {
    throw await errorFrom(response, 'Could not load your applications');
  }

  const { applications } = jobApplicationListResponseSchema.parse(await response.json());
  return applications;
}

/**
 * Apply to one role. The server independently enforces every gate the UI
 * shows — approval, a current role, an answered job search status, and one
 * application per job — so a client that drifts out of sync fails safe.
 */
export async function submitJobApplication(
  roleUid: string,
  input: SubmitJobApplicationInput,
): Promise<JobApplication> {
  const body = submitJobApplicationInputSchema.parse(input);

  const response = await customFetch(
    `${JOB_OPENINGS_API_URL}/${roleUid}/applications`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) },
    true,
  );

  if (!response?.ok) {
    throw await errorFrom(response, 'Could not send your application');
  }

  return jobApplicationSchema.parse(await response.json());
}

/**
 * Job-board sign-up. Unauthenticated — filling the form IS the sign-up, and
 * Privy authentication follows — so this uses a plain fetch rather than the
 * token-refreshing wrapper.
 */
export async function signUpToJobBoard(input: JobBoardSignUpInput): Promise<{ uid: string }> {
  const body = jobBoardSignUpInputSchema.parse(input);

  const response = await fetch(`${JOB_OPENINGS_API_URL}/sign-up`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw await errorFrom(response, 'Could not create your account');
  }

  return jobBoardSignUpResponseSchema.parse(await response.json());
}

const statusIs = (error: unknown, status: number): boolean =>
  error instanceof JobApplicationError && error.status === status;

/** Already applied. The row should report the fact, not argue with it. */
export const isAlreadyAppliedError = (error: unknown): boolean => statusIs(error, 409);

/** The account is not approved yet — applying waits, browsing doesn't. */
export const isNotApprovedError = (error: unknown): boolean => statusIs(error, 403);

/** The job was hidden or removed while the modal was open. */
export const isJobGoneError = (error: unknown): boolean => statusIs(error, 404);

/**
 * A 400 the person cannot fix by trying again — currently "this job has no
 * team leads with email addresses", i.e. there is nobody to send it to.
 * Separated from the profile-gate 400s, which they CAN fix.
 */
export const isUnreachableTeamError = (error: unknown): boolean =>
  statusIs(error, 400) && /team leads/i.test((error as JobApplicationError).message);

/** A 400 saying the profile still misses something the gate requires. */
export const isProfileIncompleteError = (error: unknown): boolean =>
  statusIs(error, 400) && /required before applying/i.test((error as JobApplicationError).message);

/** Sign-up refused because the email already has an account. */
export const isEmailTakenError = (error: unknown): boolean => statusIs(error, 409);
