'use client';

import { useState } from 'react';
import { FeedbackStatus, FEEDBACK_STATUS_ORDER, STATUS_LABELS } from './status-order';

/**
 * Admin "Move to" (§1: no drag-and-drop in v1).
 *
 * Declining asks for the public note the status model requires, so the request
 * can't be sent without one. Marking a duplicate asks for the canonical id.
 */
export default function MoveToMenu({
  currentStatus,
  onMove,
  pending,
  idPrefix,
}: {
  currentStatus: FeedbackStatus;
  onMove: (toStatus: FeedbackStatus, note?: string, duplicateOfId?: string) => void;
  pending?: boolean;
  idPrefix: string;
}) {
  const [open, setOpen] = useState(false);
  const [target, setTarget] = useState<FeedbackStatus | null>(null);
  const [note, setNote] = useState('');
  const [duplicateOfId, setDuplicateOfId] = useState('');

  const needsNote = target === 'declined';
  const needsCanonical = target === 'duplicate';
  const canConfirm = target !== null && (!needsNote || note.trim().length > 0) && (!needsCanonical || duplicateOfId.trim().length > 0);

  function reset() {
    setOpen(false);
    setTarget(null);
    setNote('');
    setDuplicateOfId('');
  }

  function confirm() {
    if (!target || !canConfirm) return;
    onMove(target, note.trim() || undefined, duplicateOfId.trim() || undefined);
    reset();
  }

  return (
    <div className="fb-moveto">
      <button
        type="button"
        className="fb-btn fb-btn--ghost fb-btn--sm"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((value) => !value)}
        data-testid={`${idPrefix}-moveto`}
        disabled={pending}
      >
        Move to
      </button>

      {open && (
        <div className="fb-moveto__panel" role="group" aria-label="Move this item">
          {FEEDBACK_STATUS_ORDER.filter((status) => status !== currentStatus).map((status) => (
            <button
              key={status}
              type="button"
              className={`fb-moveto__option ${target === status ? 'fb-moveto__option--active' : ''}`}
              onClick={() => setTarget(status)}
              data-testid={`${idPrefix}-moveto-${status}`}
            >
              {STATUS_LABELS[status]}
            </button>
          ))}

          {needsNote && (
            <label className="fb-moveto__field">
              <span className="fb-label">Public note (required)</span>
              <textarea
                className="fb-textarea"
                rows={2}
                value={note}
                onChange={(event) => setNote(event.target.value)}
                data-testid={`${idPrefix}-moveto-note`}
              />
            </label>
          )}

          {!needsNote && target && (
            <label className="fb-moveto__field">
              <span className="fb-label">Public note (optional)</span>
              <textarea
                className="fb-textarea"
                rows={2}
                value={note}
                onChange={(event) => setNote(event.target.value)}
                data-testid={`${idPrefix}-moveto-note`}
              />
            </label>
          )}

          {needsCanonical && (
            <label className="fb-moveto__field">
              <span className="fb-label">Canonical item id (required)</span>
              <input
                className="fb-input"
                value={duplicateOfId}
                onChange={(event) => setDuplicateOfId(event.target.value)}
                data-testid={`${idPrefix}-moveto-canonical`}
              />
            </label>
          )}

          <div className="fb-moveto__actions">
            <button type="button" className="fb-btn fb-btn--ghost fb-btn--sm" onClick={reset}>
              Cancel
            </button>
            <button
              type="button"
              className="fb-btn fb-btn--primary fb-btn--sm"
              disabled={!canConfirm}
              onClick={confirm}
              data-testid={`${idPrefix}-moveto-confirm`}
            >
              Confirm
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
