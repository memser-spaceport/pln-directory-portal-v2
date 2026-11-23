'use client';

import { useState } from 'react';
import { FeedbackItem, FeedbackType, TYPE_LABELS } from '@/services/plaa/feedback/feedback.types';

export interface AdminUpdate {
  type?: FeedbackType;
  is_public?: boolean;
  removed?: boolean;
}

const TYPES = Object.keys(TYPE_LABELS) as FeedbackType[];

export default function AdminActions({
  item,
  onUpdate,
}: {
  item: FeedbackItem;
  onUpdate: (update: AdminUpdate) => void;
}) {
  const [confirmingRemove, setConfirmingRemove] = useState(false);
  const label = `Admin actions for ${item.title}`;

  if (item.removed_at) {
    return (
      <div className="fb-admin__row" role="group" aria-label={label}>
        <span className="fb-badge fb-badge--muted">Removed</span>
        <button type="button" className="fb-btn fb-btn--ghost fb-btn--sm" onClick={() => onUpdate({ removed: false })}>
          Restore
        </button>
      </div>
    );
  }

  return (
    <div className="fb-admin__row" role="group" aria-label={label}>
      <label>
        <span className="fb-sr-only">Type</span>
        <select
          className="fb-select"
          value={item.type}
          onChange={(event) => onUpdate({ type: event.target.value as FeedbackType })}
        >
          {TYPES.map((type) => (
            <option key={type} value={type}>
              {TYPE_LABELS[type]}
            </option>
          ))}
        </select>
      </label>

      <button
        type="button"
        className="fb-btn fb-btn--ghost fb-btn--sm"
        onClick={() => onUpdate({ is_public: !item.is_public })}
      >
        {item.is_public ? 'Make private' : 'Make public'}
      </button>

      {confirmingRemove ? (
        <>
          <span className="fb-help">Members will no longer see this item.</span>
          <button
            type="button"
            className="fb-btn fb-btn--primary fb-btn--sm"
            onClick={() => {
              setConfirmingRemove(false);
              onUpdate({ removed: true });
            }}
          >
            Confirm remove
          </button>
          <button type="button" className="fb-btn fb-btn--ghost fb-btn--sm" onClick={() => setConfirmingRemove(false)}>
            Cancel
          </button>
        </>
      ) : (
        <button type="button" className="fb-btn fb-btn--ghost fb-btn--sm" onClick={() => setConfirmingRemove(true)}>
          Remove
        </button>
      )}
    </div>
  );
}
