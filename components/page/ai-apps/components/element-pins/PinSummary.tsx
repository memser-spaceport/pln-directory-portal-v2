'use client';

import type { ElementPin } from './types';

import s from './ElementPins.module.scss';

interface Props {
  pins: ElementPin[];
  onEdit: () => void;
}

/** The pins, read-only, inside the feedback dialog — with a way back to the panel. */
export function PinSummary({ pins, onEdit }: Props) {
  return (
    <div className={s.summary}>
      <div className={s.summaryHead}>
        <span>
          {pins.length} pinned {pins.length === 1 ? 'element' : 'elements'}
        </span>
        <button type="button" className={s.linkButton} onClick={onEdit}>
          Edit pins
        </button>
      </div>
      <ol className={s.summaryList}>
        {pins.map((pin) => (
          <li key={pin.id}>{pin.note.trim() || <em>No note</em>}</li>
        ))}
      </ol>
    </div>
  );
}
