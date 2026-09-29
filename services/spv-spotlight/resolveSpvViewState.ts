import type { SpvSpotlightStatus, SpvViewerAccess } from './types';

/**
 * What the page shows, from two independent axes: the spotlight's status and
 * the viewer's access.
 *
 * - `landing`: no request yet (signed out or in). The card offers Request access.
 * - `pending`: requested, awaiting review.
 * - `rejected`: declined; cannot request again.
 * - `openingSoon`: approved, spotlight still DRAFT.
 * - `open`: approved and OPEN; the card offers View materials.
 * - `closed`: CLOSED, the same for every viewer.
 */
export type SpvViewState = 'landing' | 'pending' | 'rejected' | 'openingSoon' | 'open' | 'closed';

/**
 * Precedence: CLOSED wins over everything, then rejected, then pending. A
 * viewer with no request can apply while the spotlight is DRAFT or OPEN.
 */
export function resolveSpvViewState(status: SpvSpotlightStatus, access: SpvViewerAccess): SpvViewState {
  if (status === 'CLOSED') return 'closed';
  if (access === 'REJECTED') return 'rejected';
  if (access === 'PENDING') return 'pending';
  if (access === 'APPROVED') return status === 'OPEN' ? 'open' : 'openingSoon';
  return 'landing';
}
