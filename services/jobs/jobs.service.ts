import { customFetch } from '@/utils/fetch-wrapper';
import type {
  IJobReferralDraft,
  IJobReferralRecipient,
  IJobReferralResult,
  IJobsFiltersResponse,
  IJobsListResponse,
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

export async function fetchJobsFilters(params: URLSearchParams): Promise<IJobsFiltersResponse> {
  const qs = buildQuery(params);
  const response = await customFetch(`/api/jobs/filters${qs ? `?${qs}` : ''}`, {}, false);
  if (!response || !response.ok) {
    throw new Error('Failed to fetch jobs filters');
  }
  return response.json();
}

/**
 * The pre-filled "Your note" for the refer modal, composed server-side from the
 * referrer's and referred member's directory records (title/company, plus a blurb
 * derived from the referred member's bio) and the role's apply link.
 *
 * Signed-in only: the backend resolves the referrer from the authenticated email
 * rather than trusting anything the client sends.
 */
export async function fetchJobReferralDraft(jobUid: string, referredMemberUid: string): Promise<IJobReferralDraft> {
  const response = await customFetch(
    `${jobOpeningsAPI}/${jobUid}/referral-draft?referredMemberUid=${encodeURIComponent(referredMemberUid)}`,
    { method: 'GET' },
    true,
  );

  if (!response?.ok) {
    throw new Error('Failed to fetch the referral draft');
  }

  return response.json();
}

/**
 * Sends the referral email and records it for auditing.
 *
 * Recipient order is meaningful: the backend makes the first one the To and CCs the
 * rest, then appends the referrer and the referred member to the CC list. Members are
 * sent as `memberUid` so their addresses are resolved server-side — the browser never
 * needs to hold anyone's email — and typed addresses go as `email`.
 */
export async function createJobReferral(
  jobUid: string,
  payload: { referredMemberUid: string; recipients: IJobReferralRecipient[]; note: string },
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
