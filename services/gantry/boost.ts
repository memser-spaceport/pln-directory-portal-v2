import { GANTRY_FROZEN_STAGES } from './constants';
import type { GantryItem } from './types';

/** Why the boost control renders as a static count instead of a button. */
export type BoostReadonlyReason = false | 'frozen' | 'author';

/**
 * The single gate for every boost entry point.
 *
 * Authors can't boost their own item: their rating already lives on the item as `authorImpact`,
 * and the server aggregate is `[authorImpact, ...pinImpacts]` — a self-boost would count it twice
 * on top of inflating `pinCount`.
 *
 * `'frozen'` outranks `'author'` because the stage lock applies to everyone and is the truer
 * reason to show. An author who ALREADY self-boosted returns `false` on purpose: they keep a
 * working unboost so the legacy pin can be released — that's what lets the existing bad data
 * heal without a backfill.
 */
export function boostReadonlyReason(
  item: Pick<GantryItem, 'stage' | 'createdByUid' | 'viewerHasPinned'>,
  viewerUid: string | undefined,
): BoostReadonlyReason {
  if (GANTRY_FROZEN_STAGES.includes(item.stage)) return 'frozen';
  if (!!viewerUid && item.createdByUid === viewerUid && !item.viewerHasPinned) return 'author';
  return false;
}
