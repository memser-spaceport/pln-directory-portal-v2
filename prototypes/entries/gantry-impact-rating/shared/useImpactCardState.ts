'use client';

import { useState } from 'react';
import type { ImpactLevel, MockRoadmapItem, PerObjectiveImpact } from '../mocks';
import { IMPACT_VALUE } from '../mocks';
import type { BoostRating } from './BoostImpactPopover';
import { deriveAggregate } from './impact';

/**
 * Local, mocked per-card state. The impact rating rides the boost flow: boosting opens the
 * post-boost popover (anchored to the button, same clamped math as production
 * useRoadmapPinActions), un-boosting retracts the viewer's rating.
 */
export function useImpactCardState(item: MockRoadmapItem, variant: 'overall' | 'per-objective') {
  const [hasBoosted, setHasBoosted] = useState(item.viewerHasPinned);
  const [boostCount, setBoostCount] = useState(item.pinCount);
  const [viewerImpact, setViewerImpact] = useState<ImpactLevel | null>(item.impact.viewerImpact);
  const [objectiveRatings, setObjectiveRatings] = useState<Record<string, ImpactLevel>>({});
  const [popoverPos, setPopoverPos] = useState<{ top: number; left: number } | null>(null);

  const toggleBoost = (next: boolean, el: HTMLButtonElement) => {
    setHasBoosted(next);
    setBoostCount((c) => (next ? c + 1 : c - 1));

    if (next) {
      // Same clamped placement as production useRoadmapPinActions (popover ~316px wide),
      // but height-aware: the per-objective variant adds a rating row per objective.
      const estHeight = variant === 'per-objective' ? 320 + item.objectives.length * 88 : 320;
      const rect = el.getBoundingClientRect();
      const top = Math.max(12, Math.min(rect.bottom + 8, window.innerHeight - estHeight));
      const left = Math.min(Math.max(12, rect.left - 120), window.innerWidth - 332);
      setPopoverPos({ top, left });
    } else {
      // Rating rides the boost: un-boosting retracts it.
      setViewerImpact(null);
      setObjectiveRatings({});
      setPopoverPos(null);
    }
  };

  const saveRating = ({ overall, perObjective }: BoostRating) => {
    setViewerImpact(overall);
    setObjectiveRatings(perObjective);
    setPopoverPos(null);
  };

  const skipRating = () => setPopoverPos(null);

  const aggregate = deriveAggregate(item.impact, viewerImpact);

  return {
    hasBoosted,
    boostCount,
    toggleBoost,
    viewerImpact,
    objectiveRatings,
    aggregate,
    popoverPos,
    saveRating,
    skipRating,
  };
}

/** Folds the viewer's per-objective rating on top of the base community aggregate. */
export function foldObjectiveImpact(
  po: PerObjectiveImpact,
  viewerLevel: ImpactLevel | null | undefined,
): PerObjectiveImpact {
  if (!viewerLevel) return po;
  const baseTotal = (po.avg ?? 0) * po.count;
  const count = po.count + 1;
  return { ...po, avg: (baseTotal + IMPACT_VALUE[viewerLevel]) / count, count };
}
