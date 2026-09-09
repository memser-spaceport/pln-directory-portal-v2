import { customFetch } from '@/utils/fetch-wrapper';
import type {
  ICreateJobReferralPayload,
  IJobReferralDraft,
  IJobReferralResult,
  IJobsFiltersResponse,
  IJobsListResponse,
  IJobTeamGroup,
} from '@/types/jobs.types';

const jobOpeningsAPI = `${process.env.DIRECTORY_API_URL}/v1/job-openings`;

const buildQuery = (params: URLSearchParams, extras: Record<string, string | undefined> = {}) => {
  const out = new URLSearchParams(params.toString());
  for (const [key, value] of Object.entries(extras)) {
    if (value === undefined || value === '') out.delete(key);
    else out.set(key, value);
  }
  return out.toString();
};

export async function fetchJobsList(params: URLSearchParams, page?: number): Promise<IJobsListResponse> {
  const pageNum = page && page > 0 ? page : 1;
  const qs = buildQuery(params, { page: String(pageNum) });
  const response = await customFetch(`/api/jobs/list${qs ? `?${qs}` : ''}`, {}, false);
  if (!response || !response.ok) {
    throw new Error('Failed to fetch jobs list');
  }
  return response.json();
}

/**
 * Load one role (and the team that posted it) so a `?job=` deep link can open
 * the drawer even when that role is not on the first page of the current rail.
 */
export async function fetchJobByUid(jobUid: string): Promise<IJobTeamGroup | null> {
  const data = await fetchJobsList(new URLSearchParams({ jobUid }));
  return data.groups[0] ?? null;
}

export async function fetchJobsFilters(params: URLSearchParams): Promise<IJobsFiltersResponse> {
  const qs = buildQuery(params);
  const response = await customFetch(`/api/jobs/filters${qs ? `?${qs}` : ''}`, {}, false);
  if (!response || !response.ok) {
    throw new Error('Failed to fetch jobs filters');
  }
  return response.json();
}

/** Who the draft is about. `JobReferralDraftQuerySchema` takes exactly one of
 *  `referredMemberUid` or `referredName` and rejects both-or-neither with a 400, so the
 *  two arms are a union rather than two optional fields. */
export type JobReferralDraftFor = { memberUid: string } | { name: string };

/**
 * The pre-filled "Your note" for the refer modal, composed server-side and returned with
 * the facts it was built from.
 *
 * For a member it draws on both directory records — title/company, plus a blurb derived
 * from the referred member's bio — and closes with a link to the role on the board. For
 * someone outside the network the server has only the name, so the note opens on it and
 * the rest is the role and the referrer.
 *
 * Signed-in only: the backend resolves the referrer from the authenticated email
 * rather than trusting anything the client sends.
 */
export async function fetchJobReferralDraft(jobUid: string, referee: JobReferralDraftFor): Promise<IJobReferralDraft> {
  const query =
    'memberUid' in referee
      ? `referredMemberUid=${encodeURIComponent(referee.memberUid)}`
      : `referredName=${encodeURIComponent(referee.name)}`;

  const response = await customFetch(`${jobOpeningsAPI}/${jobUid}/referral-draft?${query}`, { method: 'GET' }, true);

  if (!response?.ok) {
    throw new Error('Failed to fetch the referral draft');
  }

  return response.json();
}

/**
 * Sends the referral email and records it for auditing.
 *
 * Recipient order is meaningful: the backend makes the first one the To and CCs the
 * rest, then appends the referrer and (unless the tick says otherwise) the referred
 * person to the CC list. Members are sent as `memberUid` so their addresses are resolved
 * server-side — the browser never needs to hold anyone's email — and typed addresses go
 * as `email`.
 *
 * The payload carries `referredMemberUid` for a member and `referredPerson` for someone
 * outside the network; `ICreateJobReferralPayload` allows exactly one, because the
 * backend rejects any other combination.
 */
export async function createJobReferral(
  jobUid: string,
  payload: ICreateJobReferralPayload,
): Promise<IJobReferralResult> {
  const response = await customFetch(
    `${jobOpeningsAPI}/${jobUid}/referrals`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
    true,
  );

  if (!response?.ok) {
    throw new Error('Failed to send the referral');
  }

  return response.json();
}
