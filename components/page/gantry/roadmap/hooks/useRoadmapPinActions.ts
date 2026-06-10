import { useRef, useState } from 'react';
import { flyPin } from '@/components/page/gantry/shared/flyPin';
import { PinBalanceExhaustedError } from '@/services/gantry/gantry.service';
import type { useGantryAnalytics } from '@/analytics/gantry.analytics';
import type { useGantryPin } from '@/services/gantry/hooks/useGantryPin';
import type { useGantryPinNote } from '@/services/gantry/hooks/useGantryPinNote';

type Analytics = ReturnType<typeof useGantryAnalytics>;
type PinMutation = ReturnType<typeof useGantryPin>;
type PinNoteMutation = ReturnType<typeof useGantryPinNote>;

export function useRoadmapPinActions(pin: PinMutation, pinNote: PinNoteMutation, analytics: Analytics) {
  const pinStatusRef = useRef<HTMLDivElement>(null);
  const [pinNotePopover, setPinNotePopover] = useState<{ uid: string; top: number; left: number } | null>(null);
  const [swapPickerTargetUid, setSwapPickerTargetUid] = useState<string | null>(null);

  const handlePinToggle = async (uid: string, nextIsPinned: boolean, el: HTMLButtonElement) => {
    try {
      await pin.mutateAsync({ uid, nextIsPinned });
      if (nextIsPinned) {
        analytics.onItemPinned(uid);
        flyPin(el, pinStatusRef.current);
        const rect = el.getBoundingClientRect();
        const top = Math.min(rect.bottom + 8, window.innerHeight - 320);
        const left = Math.min(Math.max(12, rect.left - 120), window.innerWidth - 332);
        setTimeout(() => setPinNotePopover({ uid, top, left }), 200);
      } else {
        analytics.onItemUnpinned(uid);
      }
    } catch (err) {
      if (err instanceof PinBalanceExhaustedError) {
        setSwapPickerTargetUid(uid);
      }
    }
  };

  const handlePinNoteSave = (uid: string, note: string) => {
    setPinNotePopover(null);
    if (note.trim()) pinNote.mutate({ uid, note: note.trim() });
  };

  const handleSwapSelect = async (swapItemUid: string) => {
    if (!swapPickerTargetUid) return;
    const targetUid = swapPickerTargetUid;
    setSwapPickerTargetUid(null);
    try {
      await pin.mutateAsync({ uid: targetUid, nextIsPinned: true, swapItemUid });
      analytics.onItemPinned(targetUid);
    } catch {
      // Swap failed — rollback applied in onError
    }
  };

  const handleSwapDismiss = () => setSwapPickerTargetUid(null);

  return {
    pinStatusRef,
    pinNotePopover,
    setPinNotePopover,
    handlePinToggle,
    handlePinNoteSave,
    swapPickerTargetUid,
    handleSwapSelect,
    handleSwapDismiss,
  };
}
