'use client';

import type { MockPriority } from '../mocks';
import { PRIORITY_LABELS } from '../mocks';
import s from './SupportControls.module.scss';

interface Props {
  readonly title: string;
  readonly hint: string;
  readonly value: MockPriority;
  readonly onChange: (value: MockPriority) => void;
  readonly onConfirm: () => void;
  readonly onCancel: () => void;
  readonly confirmLabel?: string;
}

export function PriorityModal({ title, hint, value, onChange, onConfirm, onCancel, confirmLabel = 'Confirm' }: Props) {
  return (
    <div className={s.modalBackdrop} role="presentation" onClick={onCancel}>
      <div
        className={s.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="priority-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h4 id="priority-modal-title" className={s.modalTitle}>
          {title}
        </h4>
        <p className={s.modalHint}>{hint}</p>
        <label className={s.fieldLabel} htmlFor="priority-select">
          Priority for you
        </label>
        <select
          id="priority-select"
          className={s.select}
          value={value}
          onChange={(e) => onChange(e.target.value as MockPriority)}
        >
          {(Object.entries(PRIORITY_LABELS) as [MockPriority, string][]).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
        <div className={s.modalActions}>
          <button type="button" className={s.btnSecondary} onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className={s.btnPrimary} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
