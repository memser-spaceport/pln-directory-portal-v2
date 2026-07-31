'use client';

import { useCallback, useRef, useState } from 'react';

/**
 * The dismissal half of the contract.
 *
 * Production's reference dialog (GiveAiAppFeedbackDialog) sets
 * `closeOnBackdropClick={false}` unconditionally. That works, but it gives the
 * member no feedback — the click just does nothing and it reads as a broken
 * modal. This hook keeps the surface open *and* returns a `nudge` flag the
 * surface animates on, so the non-response is legible as a deliberate one.
 *
 * `requestClose` is the single exit: clean when the field is untouched,
 * routed through the Keep/Discard step when it isn't.
 */
export function useDismissGuard({ isDirty, onClose }: { isDirty: boolean; onClose: () => void }) {
  const [nudge, setNudge] = useState(false);
  const [isConfirmingDiscard, setIsConfirmingDiscard] = useState(false);
  const nudgeTimer = useRef<number | null>(null);

  /** Backdrop / outside click. Never closes while there is text to lose. */
  const onOutsideClick = useCallback(() => {
    if (!isDirty) {
      onClose();
      return;
    }

    if (nudgeTimer.current) {
      window.clearTimeout(nudgeTimer.current);
    }

    setNudge(true);
    nudgeTimer.current = window.setTimeout(() => setNudge(false), 600);
  }, [isDirty, onClose]);

  /** Cancel button, × button, or Escape. Explicit intent — but still confirmed. */
  const requestClose = useCallback(() => {
    if (isDirty) {
      setIsConfirmingDiscard(true);
      return;
    }
    onClose();
  }, [isDirty, onClose]);

  const keepDraft = useCallback(() => setIsConfirmingDiscard(false), []);

  const confirmDiscard = useCallback(
    (clearDraft: () => void) => {
      clearDraft();
      setIsConfirmingDiscard(false);
      onClose();
    },
    [onClose],
  );

  return { nudge, onOutsideClick, requestClose, isConfirmingDiscard, keepDraft, confirmDiscard };
}
