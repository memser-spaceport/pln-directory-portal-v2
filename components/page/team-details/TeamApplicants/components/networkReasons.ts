import type { SuggestedCandidate } from '@/schema/suggested-candidates';

import { interestNote } from './suggestionBand';

/**
 * One "In the network" reason on the Why suggested pane (LAB-2854, after the
 * prototype's `SuggestedWhy`): something only this product knows about the
 * member, shown above the requirements and outside the count.
 *
 * The prototype also draws contributions and vouches; the backend sends
 * neither, so the only kind today is `interest`. A new kind is a new member
 * of this union and one more push in {@link networkReasons}.
 */
export type NetworkReason = {
  kind: 'interest';
  text: string;
  /** The member's own note, whole, when they wrote one. */
  note: string | null;
};

/**
 * The member's network reasons, in the order the pane lists them; `[]` when
 * there are none, and the pane then draws no block.
 *
 * The interest copy names "your team or this role" because the flag is set
 * for either (`interested` in the backend's `job-match.service.ts`).
 */
export function networkReasons(suggestion: Pick<SuggestedCandidate, 'interested' | 'note'>): NetworkReason[] {
  const reasons: NetworkReason[] = [];
  if (suggestion.interested) {
    reasons.push({
      kind: 'interest',
      text: 'Pressed I’m interested on your team or this role',
      note: interestNote(suggestion),
    });
  }
  return reasons;
}

/** "Why we suggested Ana": the member's first name, or "them" when there is none. */
export const whyTitle = (name: string) => `Why we suggested ${name.trim().split(/\s+/)[0] || 'them'}`;
