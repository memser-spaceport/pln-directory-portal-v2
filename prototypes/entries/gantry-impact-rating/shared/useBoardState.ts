'use client';

import { useState } from 'react';
import type { ImpactLevel, MockRoadmapItem } from '../mocks';
import { mockRoadmapItems } from '../mocks';
import type { BoostRating } from './BoostImpactPopover';

export interface ItemViewerState {
  hasBoosted: boolean;
  boostCount: number;
  viewerImpact: ImpactLevel | null;
  viewerNote: string | null;
  objectiveRatings: Record<string, ImpactLevel>;
}

function seedState(items: MockRoadmapItem[]): Record<string, ItemViewerState> {
  return Object.fromEntries(
    items.map((item) => [
      item.uid,
      {
        hasBoosted: item.viewerHasPinned,
        boostCount: item.pinCount,
        viewerImpact: item.impact.viewerImpact,
        viewerNote: null,
        objectiveRatings: {},
      },
    ]),
  );
}

/**
 * Page-level board state. Boost and rate are one action: boosting opens the combined
 * popover and is only committed once an impact rating is picked — canceling reverts the
 * boost. Un-boosting removes the rating (they're the same signal) and surfaces a toast.
 */
export function useBoardState(variant: 'overall' | 'per-objective') {
  const [items, setItems] = useState<MockRoadmapItem[]>(mockRoadmapItems);
  const [state, setState] = useState<Record<string, ItemViewerState>>(() => seedState(mockRoadmapItems));
  const [popover, setPopover] = useState<{ uid: string; top: number; left: number } | null>(null);
  const [drawerUid, setDrawerUid] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const patch = (uid: string, part: Partial<ItemViewerState>) =>
    setState((prev) => ({ ...prev, [uid]: { ...prev[uid], ...part } }));

  const revertBoost = (uid: string) =>
    setState((prev) => ({
      ...prev,
      [uid]: {
        ...prev[uid],
        hasBoosted: false,
        boostCount: prev[uid].boostCount - 1,
        viewerImpact: null,
        viewerNote: null,
        objectiveRatings: {},
      },
    }));

  const toggleBoost = (item: MockRoadmapItem, next: boolean, el: HTMLButtonElement) => {
    if (next) {
      // Optimistically boost, then require a rating to commit it.
      patch(item.uid, { hasBoosted: true, boostCount: state[item.uid].boostCount + 1 });
      const estHeight = variant === 'per-objective' ? 380 + item.objectives.length * 120 : 380;
      const rect = el.getBoundingClientRect();
      const top = Math.max(12, Math.min(rect.bottom + 8, window.innerHeight - estHeight));
      const left = Math.min(Math.max(12, rect.left - 150), window.innerWidth - 388);
      setPopover({ uid: item.uid, top, left });
      return;
    }

    // Un-boosting: the rating rides the boost, so it's removed too.
    const hadRating = state[item.uid].viewerImpact !== null;
    setState((prev) => ({
      ...prev,
      [item.uid]: {
        ...prev[item.uid],
        hasBoosted: false,
        boostCount: prev[item.uid].boostCount - 1,
        viewerImpact: null,
        viewerNote: null,
        objectiveRatings: {},
      },
    }));
    if (popover?.uid === item.uid) setPopover(null);
    if (hadRating) {
      setToast('Boost removed — your impact rating was removed with it.');
      window.setTimeout(() => setToast(null), 4500);
    }
  };

  /** Commit the boost with its (mandatory) rating. */
  const savePopoverRating = (rating: BoostRating) => {
    if (popover && rating.overall) {
      patch(popover.uid, {
        viewerImpact: rating.overall,
        viewerNote: rating.note || null,
        objectiveRatings: rating.perObjective,
      });
    }
    setPopover(null);
  };

  /** Dismiss the popover without rating → the boost is not committed. */
  const cancelPopover = () => {
    if (popover) revertBoost(popover.uid);
    setPopover(null);
  };

  const publishItem = (item: MockRoadmapItem) => {
    setItems((prev) => [item, ...prev]);
    setState((prev) => ({
      ...prev,
      // The author's own rating rides in as their boost — seed from the item like the mocks.
      [item.uid]: {
        hasBoosted: item.viewerHasPinned,
        boostCount: item.pinCount,
        viewerImpact: item.impact.viewerImpact,
        viewerNote: null,
        objectiveRatings: {},
      },
    }));
  };

  return {
    items,
    state,
    popover,
    drawerUid,
    toast,
    dismissToast: () => setToast(null),
    openDrawer: setDrawerUid,
    closeDrawer: () => setDrawerUid(null),
    toggleBoost,
    savePopoverRating,
    cancelPopover,
    publishItem,
  };
}
