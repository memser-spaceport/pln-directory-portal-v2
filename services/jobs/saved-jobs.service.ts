import type { ISavedJob } from '@/types/jobs.types';
import { customFetch } from '@/utils/fetch-wrapper';

const JOB_OPENINGS_API_URL = `${process.env.DIRECTORY_API_URL}/v1/job-openings`;

/** Both writes carry the uid in the path and nothing else, but the API answers
 *  a bodiless POST with a 415 — the contract declares an optional object body. */
const EMPTY_JSON_BODY = { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) };

export async function fetchSavedJobs(): Promise<ISavedJob[]> {
  const response = await customFetch(`${JOB_OPENINGS_API_URL}/saved`, { method: 'GET' }, true);

  if (!response?.ok) {
    throw new Error('Could not load your saved jobs');
  }

  const { savedJobs } = (await response.json()) as { savedJobs: ISavedJob[] };
  return savedJobs;
}

/* Both writes are idempotent server-side and answer with `{ jobUid,
   viewerHasSaved }` — which nothing reads: the caller already knows which role
   it pressed and which way. All that matters here is that a refusal throws. */

export async function saveJob(roleUid: string): Promise<void> {
  const response = await customFetch(
    `${JOB_OPENINGS_API_URL}/${roleUid}/save`,
    { method: 'POST', ...EMPTY_JSON_BODY },
    true,
  );

  if (!response?.ok) {
    throw new Error('Could not save this role');
  }
}

export async function unsaveJob(roleUid: string): Promise<void> {
  const response = await customFetch(
    `${JOB_OPENINGS_API_URL}/${roleUid}/save`,
    { method: 'DELETE', ...EMPTY_JSON_BODY },
    true,
  );

  if (!response?.ok) {
    throw new Error('Could not remove this role from your saved list');
  }
}
