import type { SpvSpotlightStatus, SpvViewerAccess } from './types';

/**
 * What the page shows, from the spotlight's status, the viewer's access and
 * whether anyone is signed in.
 *
 * Request flow (`REQUEST_FLOW_ENABLED`):
 * - `landing`: no request yet (signed out or in). The card offers Request access.
 * - `pending`: requested, awaiting review.
 * - `rejected`: declined; cannot request again.
 *
 * Gated (token links, the default):
 * - `lockedSignedOut`: nobody signed in. Only a Sign in prompt, no deal content.
 * - `lockedNoAccess`: signed in but not approved. Only a no-access message.
 *
 * Both:
 * - `openingSoon`: approved, spotlight still DRAFT.
 * - `open`: approved and OPEN; the card links to the data room.
 * - `closed`: CLOSED.
 */
export type SpvViewState =
  | 'landing'
  | 'pending'
  | 'rejected'
  | 'lockedSignedOut'
  | 'lockedNoAccess'
  | 'openingSoon'
  | 'open'
  | 'closed';

export type SpvViewStateOptions = {
  signedIn: boolean;
  /** `REQUEST_FLOW_ENABLED`, passed in so both mappings stay testable. */
  requestFlow: boolean;
};

export function isSpvLockedState(state: SpvViewState | null): state is 'lockedSignedOut' | 'lockedNoAccess' {
  return state === 'lockedSignedOut' || state === 'lockedNoAccess';
}

/**
 * Request flow precedence: CLOSED wins over everything, then rejected, then
 * pending. A viewer with no request can apply while the spotlight is DRAFT or
 * OPEN.
 *
 * Gated: only an APPROVED viewer (pre-approved invitee or approved request)
 * sees the spotlight at all, whatever its status. Everyone else is locked out,
 * a pending or rejected request included, so a CLOSED spotlight still never
 * shows its content to them.
 */
export function resolveSpvViewState(
  status: SpvSpotlightStatus,
  access: SpvViewerAccess,
  { signedIn, requestFlow }: SpvViewStateOptions,
): SpvViewState {
  if (!requestFlow) {
    if (!signedIn) return 'lockedSignedOut';
    if (access !== 'APPROVED') return 'lockedNoAccess';
    if (status === 'CLOSED') return 'closed';
    return status === 'OPEN' ? 'open' : 'openingSoon';
  }
  if (status === 'CLOSED') return 'closed';
  if (access === 'REJECTED') return 'rejected';
  if (access === 'PENDING') return 'pending';
  if (access === 'APPROVED') return status === 'OPEN' ? 'open' : 'openingSoon';
  return 'landing';
}
