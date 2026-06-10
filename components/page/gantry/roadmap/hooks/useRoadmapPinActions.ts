import { useRef, useState } from 'react';
import { flyPin } from '@/components/page/gantry/shared/flyPin';
import { PinBalanceExhaustedError } from '@/services/gantry/gantry.service';
import type { GantryPinStatus } from '@/services/gantry/types';
import type { useGantryAnalytics } from '@/analytics/gantry.analytics';
import type { useGantryPin } from '@/services/gantry/hooks/useGantryPin';
import type { useGantryPinNote } from '@/services/gantry/hooks/useGantryPinNote';

type Analytics = ReturnType<typeof useGantryAnalytics>;
type PinMutation = ReturnType<typeof useGantryPin>;
type PinNoteMutation = ReturnType<typeof useGantryPinNote>;

type SwapPickerState = { uid: string; top: number; left: number };

function computeSwapPickerPos(el: HTMLButtonElement): { top: number; left: number } {
  const rect = el.getBoundingClientRect();
  const pickerWidth = 320;
  const pickerHeight = 340;
  const top = Math.min(rect.bottom + 6, window.innerHeight - pickerHeight - 12);
  const left = Math.min(Math.max(12, rect.left - pickerWidth / 2), window.innerWidth - pickerWidth - 12);
  return { top, left };
}

export function useRoadmapPinActions(
  pin: PinMutation,
  pinNote: PinNoteMutation,
  analytics: Analytics,
  pinStatus: GantryPinStatus | undefined,
) {
  const pinStatusRef = useRef<HTMLDivElement>(null);
  const [pinNotePopover, setPinNotePopover] = useState<{ uid: string; top: number; left: number } | null>(null);
  const [swapPickerState, setSwapPickerState] = useState<SwapPickerState | null>(null);

  const handlePinToggle = async (uid: string, nextIsPinned: boolean, el: HTMLButtonElement) => {
    // Pre-check: if budget exhausted, open swap picker immediately without a server round-trip.
    if (nextIsPinned && pinStatus && pinStatus.remaining <= 0) {
      setSwapPickerState({ uid, ...computeSwapPickerPos(el) });
      return;
    }

    const pos = computeSwapPickerPos(el);
    try {
      await pin.mutateAsync({ uid, nextIsPinned });
      if (nextIsPinned) {
        analytics.onItemBoosted(uid);
        flyPin(el, pinStatusRef.current);
        const rect = el.getBoundingClientRect();
        const top = Math.min(rect.bottom + 8, window.innerHeight - 320);
        const left = Math.min(Math.max(12, rect.left - 120), window.innerWidth - 332);
        setTimeout(() => setPinNotePopover({ uid, top, left }), 200);
      } else {
        analytics.onItemUnboosted(uid);
      }
    } catch (err) {
      // Fallback: server says budget exhausted even though we thought we had room
      // (e.g. another device pinned something in the meantime).
      if (err instanceof PinBalanceExhaustedError) {
        setSwapPickerState({ uid, ...pos });
      }
    }
  };

  const handlePinNoteSave = (uid: string, note: string) => {
    setPinNotePopover(null);
    if (note.trim()) pinNote.mutate({ uid, note: note.trim() });
  };

  const handleSwapSelect = async (swapItemUid: string) => {
    if (!swapPickerState) return;
    const targetUid = swapPickerState.uid;
    setSwapPickerState(null);
    try {
      await pin.mutateAsync({ uid: targetUid, nextIsPinned: true, swapItemUid });
      analytics.onItemBoosted(targetUid);
    } catch {
      // Swap failed — rollback applied in onError
    }
  };

  const handleSwapDismiss = () => setSwapPickerState(null);

  return {
    pinStatusRef,
    pinNotePopover,
    setPinNotePopover,
    handlePinToggle,
    handlePinNoteSave,
    swapPickerState,
    handleSwapSelect,
    handleSwapDismiss,
  };
}
