import { customFetch } from '@/utils/fetch-wrapper';
import { SPV_MOCK_ENABLED } from './constants';
import { getMockSpvSpotlight, mockRequestSpvAccess, type SpvMockOverrides } from './spv-spotlight.mock';
import {
  SpvAccessRequestBlockedError,
  type SpvAccessRequestBlockReason,
  type SpvAccessRequestPayload,
  type SpvAccessRequestResult,
  type SpvSpotlight,
} from './types';

const BLOCK_REASONS: SpvAccessRequestBlockReason[] = ['ALREADY_APPLIED', 'REJECTED', 'PRE_APPROVED'];

/** Client-side read. Resolves null for an unknown slug. */
export async function getSpvSpotlight(
  slug: string,
  authenticated: boolean,
  mockOverrides?: SpvMockOverrides,
): Promise<SpvSpotlight | null> {
  if (SPV_MOCK_ENABLED) {
    return getMockSpvSpotlight(slug, authenticated, mockOverrides);
  }

  const url = `${process.env.DIRECTORY_API_URL}/v1/spv-spotlights/${encodeURIComponent(slug)}`;
  const response = await customFetch(url, { method: 'GET' }, authenticated);
  if (response?.status === 404) return null;
  if (!response?.ok) {
    throw new Error('Failed to fetch SPV spotlight');
  }
  return (await response.json()) as SpvSpotlight;
}

/**
 * Requesting access is signing up: the backend creates the account when the
 * email is new. A 409 means the email can't request again and should sign in.
 */
export async function requestSpvAccess(
  slug: string,
  payload: SpvAccessRequestPayload,
  authenticated: boolean,
): Promise<SpvAccessRequestResult> {
  if (SPV_MOCK_ENABLED) {
    return mockRequestSpvAccess(slug, payload, authenticated);
  }

  const url = `${process.env.DIRECTORY_API_URL}/v1/spv-spotlights/${encodeURIComponent(slug)}/access-requests`;
  const response = await customFetch(
    url,
    {
      method: 'POST',
      // customFetch adds no Content-Type of its own.
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
    authenticated,
  );

  if (response?.status === 409) {
    const body = await response.json().catch(() => null);
    const reason = body?.reason as SpvAccessRequestBlockReason | undefined;
    throw new SpvAccessRequestBlockedError(reason && BLOCK_REASONS.includes(reason) ? reason : 'ALREADY_APPLIED');
  }
  if (!response?.ok) {
    const body = await response?.json().catch(() => null);
    throw new Error(body?.message || 'Failed to request access');
  }
  return (await response.json()) as SpvAccessRequestResult;
}
