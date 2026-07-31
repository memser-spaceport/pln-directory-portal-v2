'use client';

import { toast as reactToastify } from 'react-toastify';

// Production's toast, not a bespoke one. `ToastContainer` is mounted in the
// root layout (app/layout.tsx), which wraps prototype routes too, so calling
// this renders through the real react-toastify instance and the real `Toast`
// shell — same position, transition, elevation and status icon as every other
// toast in the app.
import { toast } from '@/components/core/ToastContainer';
// The same Button the warm-intros-v2 PathFeedback strip uses for its Undo,
// so the two undo affordances match.
import { Button } from '@/components/common/Button';

import s from './NotificationsHub.module.scss';

/** How long the undo window stays open. */
export const UNDO_MS = 8000;

/**
 * One stable id, so a second action replaces the open toast instead of
 * stacking a pile of them — bulk read actions come in bursts.
 */
const TOAST_ID = 'notifications-hub-undo';

/**
 * Feedback for a completed action, with Undo when the action is reversible.
 *
 * `toast()` takes a ReactNode, so the button goes straight into the existing
 * shell; nothing here re-implements a toast. The wrapper doesn't return the
 * toast id, so dismissal goes through react-toastify's own `dismiss` keyed on
 * the id we pass in.
 */
export function showUndoToast(message: string, onUndo?: () => void) {
  const dismiss = () => reactToastify.dismiss(TOAST_ID);

  // Replace rather than queue behind an already-open toast.
  dismiss();

  toast.success(
    <span className={s.toastRow}>
      <span className={s.toastMessage}>{message}</span>
      {onUndo && (
        <Button
          style="link"
          variant="secondary"
          size="xxs"
          underline
          onClick={() => {
            onUndo();
            dismiss();
          }}
        >
          Undo
        </Button>
      )}
    </span>,
    { toastId: TOAST_ID, autoClose: UNDO_MS },
  );
}
