import { customFetch } from '@/utils/fetch-wrapper';
import {
  SpvAccessRequestBlockedError,
  SpvAccessRequestValidationError,
  SpvSpotlightClosedError,
  type SpvAccessRequestBlockReason,
  type SpvAccessRequestPayload,
  type SpvAccessRequestResult,
  type SpvSpotlight,
} from './types';

const BLOCK_REASONS: SpvAccessRequestBlockReason[] = ['ALREADY_APPLIED', 'REJECTED', 'PRE_APPROVED'];

const spotlightUrl = (slug: string) => `${process.env.DIRECTORY_API_URL}/v1/spv-spotlights/${encodeURIComponent(slug)}`;

/**
 * Client-side read, with the viewer's token when signed in (the API computes
 * `viewerAccess` from it). Resolves null for an unknown slug.
 */
export async function getSpvSpotlight(slug: string, authenticated: boolean): Promise<SpvSpotlight | null> {
  const response = await customFetch(spotlightUrl(slug), { method: 'GET', cache: 'no-store' }, authenticated);
  if (response?.status === 404) return null;
  if (!response?.ok) {
    throw new Error('Failed to fetch SPV spotlight');
  }
  return (await response.json()) as SpvSpotlight;
}

/**
 * Requesting access is signing up: the backend creates the account when the
 * email is new. A 409 with a reason means the email can't request again and
 * should sign in; a 409 without one means the spotlight closed.
 */
export async function requestSpvAccess(
  slug: string,
  payload: SpvAccessRequestPayload,
  authenticated: boolean,
): Promise<SpvAccessRequestResult> {
  const response = await customFetch(
    `${spotlightUrl(slug)}/access-requests`,
    {
      method: 'POST',
      // customFetch adds no Content-Type of its own.
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
    authenticated,
  );

  if (response?.ok) {
    return (await response.json()) as SpvAccessRequestResult;
  }

  const body = await response?.json().catch(() => null);

  if (response?.status === 409) {
    const reason = body?.reason as SpvAccessRequestBlockReason | undefined;
    if (reason && BLOCK_REASONS.includes(reason)) throw new SpvAccessRequestBlockedError(reason);
    // The closed 409 carries only a message; `reason` is a machine code and never lives inside it.
    if (typeof body?.message === 'string' && /closed/i.test(body.message)) throw new SpvSpotlightClosedError();
    // A missing (or future) reason: the backend's own advice is to treat it as already applied.
    throw new SpvAccessRequestBlockedError('ALREADY_APPLIED');
  }
  if (response?.status === 422 && typeof body?.message === 'string') {
    throw new SpvAccessRequestValidationError(body.message);
  }
  throw new Error(typeof body?.message === 'string' ? body.message : 'Failed to request access');
}
