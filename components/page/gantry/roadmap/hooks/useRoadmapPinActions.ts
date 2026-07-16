import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { flyPin } from '@/components/page/gantry/shared/flyPin';
import { GANTRY_IMPACT_UI_ENABLED } from '@/utils/feature-flags';
import { PinBalanceExhaustedError } from '@/services/gantry/gantry.service';
import { GantryQueryKeys } from '@/services/gantry/constants';
import type {
  GantryImpactValue,
  GantryItem,
  GantryItemListResponse,
  GantryObjectiveImpacts,
  GantryPinStatus,
  GantryStage,
} from '@/services/gantry/types';
import type { BoostImpactRating } from '@/components/page/gantry/shared/BoostImpactPopover';
import type { useGantryAnalytics } from '@/analytics/gantry.analytics';
import type { useGantryPin } from '@/services/gantry/hooks/useGantryPin';
import type { useGantryPinUpdate } from '@/services/gantry/hooks/useGantryPinUpdate';

type Analytics = ReturnType<typeof useGantryAnalytics>;
type PinMutation = ReturnType<typeof useGantryPin>;
type PinUpdateMutation = ReturnType<typeof useGantryPinUpdate>;

type Pos = { top: number; left: number };

const FROZEN_STAGES: readonly GantryStage[] = ['IN_PROGRESS', 'SHIPPED', 'DECLINED'];

/**
 * The rate-first boost flow is one state machine — rating popover and swap picker are steps
 * of the same flow, so invalid combinations (both open, stale carried rating) can't exist.
 * Positions are captured once at boost-click: the optimistic pinCount change can trend-sort
 * the card away mid-flow, so the anchor element must never be touched again.
 */
type BoostFlowState =
  | { step: 'rate'; uid: string; pos: Pos; swapPos: Pos }
  | {
      step: 'swap';
      uid: string;
      pos: Pos;
      swapPos: Pos;
      impact?: GantryImpactValue;
      note?: string;
      objectiveImpacts?: GantryObjectiveImpacts;
    };

function computeSwapPickerPos(el: HTMLButtonElement): Pos {
  const rect = el.getBoundingClientRect();
  const pickerWidth = 320;
  const pickerHeight = 340;
  const top = Math.min(rect.bottom + 6, window.innerHeight - pickerHeight - 12);
  const left = Math.min(Math.max(12, rect.left - pickerWidth / 2), window.innerWidth - pickerWidth - 12);
  return { top, left };
}

function computePopoverPos(el: HTMLButtonElement): Pos {
  const rect = el.getBoundingClientRect();
  const top = Math.min(rect.bottom + 8, window.innerHeight - 320);
  const left = Math.min(Math.max(12, rect.left - 120), window.innerWidth - 332);
  return { top, left };
}

export function useRoadmapPinActions(
  pin: PinMutation,
  pinUpdate: PinUpdateMutation,
  analytics: Analytics,
  pinStatus: GantryPinStatus | undefined,
) {
  const queryClient = useQueryClient();
  const pinStatusRef = useRef<HTMLDivElement>(null);

  // Legacy commit-then-note flow, kept verbatim for flag-off; delete at impact cleanup.
  const [pinNotePopover, setPinNotePopover] = useState<{ uid: string; top: number; left: number } | null>(null);
  const notePopoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [boostFlow, setBoostFlow] = useState<BoostFlowState | null>(null);

  const clearNotePopoverTimeout = () => {
    if (notePopoverTimeoutRef.current !== null) {
      clearTimeout(notePopoverTimeoutRef.current);
      notePopoverTimeoutRef.current = null;
    }
  };
  // A pending popover must not materialize after unmount (drawer closed, route change) or for
  // an item the viewer just un-boosted again.
  useEffect(() => clearNotePopoverTimeout, []);

  /** Cache-first item lookup: detail cache, then any ITEMS list cache. */
  const findItemInCache = (uid: string): GantryItem | undefined => {
    const detail = queryClient.getQueryData<GantryItem | null>([GantryQueryKeys.ITEM, uid]);
    if (detail) return detail;
    for (const [, data] of queryClient.getQueriesData<GantryItemListResponse>({
      queryKey: [GantryQueryKeys.ITEMS],
    })) {
      const found = data?.items.find((it) => it.uid === uid);
      if (found) return found;
    }
    return undefined;
  };

  const commitBoost = async (
    uid: string,
    rating: { impact?: GantryImpactValue; note?: string; objectiveImpacts?: GantryObjectiveImpacts },
    swapItemUid?: string,
  ) => {
    try {
      await pin.mutateAsync({ uid, nextIsPinned: true, ...rating, swapItemUid });
      setBoostFlow(null);
      analytics.onItemBoosted(uid, rating.impact);
      flyPin(null, pinStatusRef.current);
      return true;
    } catch (err) {
      if (err instanceof PinBalanceExhaustedError) {
        // Budget gone under us (another tab/device) — carry the entered rating into the swap retry.
        setBoostFlow((prev) => (prev ? { ...prev, step: 'swap', ...rating } : prev));
      } else {
        setBoostFlow(null);
      }
      return false;
    }
  };

  const handlePinToggle = async (uid: string, nextIsPinned: boolean, el: HTMLButtonElement) => {
    if (pin.isPending) return; // single-flight: never interleave pin mutations

    if (GANTRY_IMPACT_UI_ENABLED && nextIsPinned) {
      // Rate first, then commit — nothing is mutated until the popover saves.
      setBoostFlow({ step: 'rate', uid, pos: computePopoverPos(el), swapPos: computeSwapPickerPos(el) });
      return;
    }

    // Pre-check: if budget exhausted, open swap picker immediately without a server round-trip.
    if (nextIsPinned && pinStatus && pinStatus.remaining <= 0) {
      setBoostFlow({ step: 'swap', uid, pos: computePopoverPos(el), swapPos: computeSwapPickerPos(el) });
      return;
    }

    const swapPos = computeSwapPickerPos(el);
    const pos = computePopoverPos(el);
    try {
      await pin.mutateAsync({ uid, nextIsPinned });
      if (nextIsPinned) {
        analytics.onItemBoosted(uid);
        flyPin(el, pinStatusRef.current);
        clearNotePopoverTimeout();
        notePopoverTimeoutRef.current = setTimeout(() => setPinNotePopover({ uid, ...pos }), 200);
      } else {
        clearNotePopoverTimeout();
        analytics.onItemUnboosted(uid);
      }
    } catch (err) {
      // Fallback: server says budget exhausted even though we thought we had room
      // (e.g. another device pinned something in the meantime).
      if (err instanceof PinBalanceExhaustedError) {
        setBoostFlow({ step: 'swap', uid, pos, swapPos });
      }
    }
  };

  /** Save from the rating popover — the boost commits here, and only here. */
  const handleBoostRateSave = async (rating: BoostImpactRating) => {
    if (!boostFlow || boostFlow.step !== 'rate' || pin.isPending) return;
    const { uid } = boostFlow;

    // The popover may have sat open while the item changed underneath (refetch, other tab):
    // a frozen or already-boosted item must not be optimistically pinned only to snap back.
    const item = findItemInCache(uid);
    if (item && (FROZEN_STAGES.includes(item.stage) || item.viewerHasPinned)) {
      setBoostFlow(null);
      return;
    }

    // Re-read the balance from cache at save time — the render-time prop may be stale.
    const statusNow = queryClient.getQueryData<GantryPinStatus>([GantryQueryKeys.PIN_STATUS]) ?? pinStatus;
    if (statusNow && statusNow.remaining <= 0) {
      setBoostFlow({
        ...boostFlow,
        step: 'swap',
        impact: rating.impact,
        note: rating.note || undefined,
        objectiveImpacts: rating.objectiveImpacts,
      });
      return;
    }

    await commitBoost(uid, {
      impact: rating.impact,
      note: rating.note || undefined,
      objectiveImpacts: rating.objectiveImpacts,
    });
  };

  const handleBoostCancel = () => {
    if (pin.isPending) return; // dismissal is a no-op once the commit is in flight
    setBoostFlow(null);
  };

  const handlePinNoteSave = (uid: string, note: string) => {
    setPinNotePopover(null);
    if (note.trim()) pinUpdate.mutate({ uid, note: note.trim() });
  };

  const handleSwapSelect = async (swapItemUid: string) => {
    if (!boostFlow || boostFlow.step !== 'swap' || pin.isPending) return;
    const { uid, impact, note, objectiveImpacts } = boostFlow;
    if (GANTRY_IMPACT_UI_ENABLED && impact === undefined) {
      // Swap started before a rating was collected (pre-check path) — collect it first.
      setBoostFlow({ ...boostFlow, step: 'rate' });
      return;
    }
    setBoostFlow(null);
    try {
      await pin.mutateAsync({ uid, nextIsPinned: true, impact, note, objectiveImpacts, swapItemUid });
      analytics.onItemBoosted(uid, impact);
    } catch {
      // Swap failed — rollback applied in onError
    }
  };

  const handleSwapDismiss = () => setBoostFlow(null);

  return {
    pinStatusRef,
    // Legacy note flow (impact UI off)
    pinNotePopover,
    setPinNotePopover,
    handlePinNoteSave,
    // Rate-first flow (impact UI on)
    ratePopover: boostFlow?.step === 'rate' ? { uid: boostFlow.uid, ...boostFlow.pos } : null,
    handleBoostRateSave,
    handleBoostCancel,
    isBoostCommitting: pin.isPending,
    // Swap picker (both modes)
    swapPickerState: boostFlow?.step === 'swap' ? { uid: boostFlow.uid, ...boostFlow.swapPos } : null,
    handlePinToggle,
    handleSwapSelect,
    handleSwapDismiss,
  };
}
