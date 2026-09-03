import { JobInterest, jobInterestListResponseSchema, jobInterestSchema } from '@/schema/job-interests';
import { customFetch } from '@/utils/fetch-wrapper';

const JOB_OPENINGS_API_URL = `${process.env.DIRECTORY_API_URL}/v1/job-openings`;

export type { JobInterest };

/**
 * A refusal from the interest endpoints.
 *
 * Deliberately its own class rather than a reuse of `JobApplicationError`:
 * callers tell the two apart with `instanceof`, and an interest that failed is
 * a different situation from an application that failed — one is worth a silent
 * retry, the other is not.
 *
 * The reading below is near-identical to `job-applications.service.ts`'s. Two
 * copies is the right number; at a third, lift the body-reading into a shared
 * `job-openings-error` module rather than growing this one.
 */
export class JobInterestError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'JobInterestError';
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
async function errorFrom(response: Response | undefined, fallback: string): Promise<JobInterestError> {
  if (!response) {
    return new JobInterestError(401, 'Your session expired. Sign in and try again.');
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
  return new JobInterestError(response.status, message);
}

/**
 * Every role this member has signalled interest in. One whole-list read: the
 * universe is known server-side, so a uid absent from the response means not
 * interested rather than not-yet-known — which is what lets every banner on the
 * surface share one fetch and treat cache-absence as an answer.
 */
export async function fetchJobInterests(): Promise<JobInterest[]> {
  const response = await customFetch(`${JOB_OPENINGS_API_URL}/interests`, { method: 'GET' }, true);

  if (!response?.ok) {
    throw await errorFrom(response, 'Could not load your interests');
  }

  const { interests } = jobInterestListResponseSchema.parse(await response.json());
  return interests;
}

/** Signal interest in one role. Idempotent server-side — see `isAlreadyInterestedError`. */
export async function markJobInterest(roleUid: string): Promise<JobInterest> {
  const response = await customFetch(`${JOB_OPENINGS_API_URL}/${roleUid}/interests`, { method: 'POST' }, true);

  if (!response?.ok) {
    throw await errorFrom(response, 'Could not save your interest');
  }

  return jobInterestSchema.parse(await response.json());
}

/**
 * Withdraw it. Returns nothing — a 204 and a "there was nothing there" are the
 * same outcome from the person's side, which is why this does not parse a body.
 */
export async function clearJobInterest(roleUid: string): Promise<void> {
  const response = await customFetch(`${JOB_OPENINGS_API_URL}/${roleUid}/interests`, { method: 'DELETE' }, true);

  if (!response?.ok) {
    throw await errorFrom(response, 'Could not undo your interest');
  }
}

const statusIs = (error: unknown, status: number): boolean =>
  error instanceof JobInterestError && error.status === status;

/**
 * The server already holds this interest. Not an error the person should ever
 * read: the state they asked for is the state that exists, so callers treat it
 * as success and refetch rather than rolling back.
 */
export const isAlreadyInterestedError = (error: unknown): boolean => statusIs(error, 409);

/** The job was hidden or removed while the drawer was open. */
export const isJobGoneError = (error: unknown): boolean => statusIs(error, 404);
