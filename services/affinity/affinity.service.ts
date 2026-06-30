import { customFetch } from '@/utils/fetch-wrapper';
import { AffinityMemberResponse, AffinityRetriggerResponse } from './types';

export class AffinityRetriggerError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly userMessage?: string,
  ) {
    super(message);
    this.name = 'AffinityRetriggerError';
  }
}

const GENERIC_RETRIGGER_ERROR = 'Something went wrong. Please try again.';

export async function getAffinityMember(uid: string): Promise<AffinityMemberResponse | null> {
  const response = await customFetch(
    `${process.env.DIRECTORY_API_URL}/v1/affinity/members/${uid}`,
    { method: 'GET', headers: { 'Content-Type': 'application/json' } },
    true,
  );
  if (!response) return null;
  if (response.status === 404) return null;
  if (!response.ok) throw new Error('Failed to fetch affinity data');
  return response.json();
}

export async function retriggerAffinityEnrichment(memberUid: string): Promise<AffinityRetriggerResponse> {
  const response = await customFetch(
    `${process.env.DIRECTORY_API_URL}/v1/affinity/members/${memberUid}/retrigger-enrichment`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' } },
    true,
  );

  if (!response) {
    throw new AffinityRetriggerError('Request failed', 0, GENERIC_RETRIGGER_ERROR);
  }

  if (response.ok) {
    return response.json();
  }

  const status = response.status;
  let backendMessage = 'Failed to refresh relationship data';
  try {
    const body = await response.json();
    if (typeof body?.message === 'string') {
      backendMessage = body.message;
    } else if (Array.isArray(body?.message)) {
      backendMessage = body.message.join(', ');
    }
  } catch {
    // keep default message
  }

  if (status === 409) {
    throw new AffinityRetriggerError(backendMessage, status, 'Enrichment already in progress');
  }
  if (status === 429) {
    throw new AffinityRetriggerError(backendMessage, status, backendMessage);
  }

  throw new AffinityRetriggerError(backendMessage, status, GENERIC_RETRIGGER_ERROR);
}
