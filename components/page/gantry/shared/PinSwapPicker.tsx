'use client';

import { GANTRY_STAGE_LABELS } from '@/services/gantry/constants';
import type { GantryUserPin } from '@/services/gantry/types';
import s from './PinSwapPicker.module.scss';

interface Props {
  readonly targetItemTitle: string;
  readonly pins: GantryUserPin[];
  readonly pos: { top: number; left: number };
  readonly onSelect: (swapItemUid: string) => void;
  readonly onDismiss: () => void;
}

function PinItemIcon() {
  return (
    <span className={s.pinItemIcon} aria-hidden>
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect width="16" height="16" rx="4" fill="#e0e7ff" />
        <path d="M8 4v5m0 0l-2-2m2 2l2-2" stroke="#6366f1" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

export function PinSwapPicker({ targetItemTitle, pins, pos, onSelect, onDismiss }: Props) {
  return (
    <>
      <div className={s.backdrop} onClick={onDismiss} />
      <div className={s.popover} style={{ top: pos.top, left: pos.left }}>
        <div className={s.header}>
          <span className={s.headerTitle}>All pins in use</span>
          <button type="button" className={s.closeBtn} onClick={onDismiss} aria-label="Close">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
              <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <p className={s.sub}>Unpin one to move it to &ldquo;{targetItemTitle}&rdquo;</p>

        <ul className={s.pinList}>
          {pins.map((pin) => (
            <li key={pin.uid} className={s.pinRow}>
              <PinItemIcon />
              <div className={s.pinItemBody}>
                <span className={s.pinItemTitle}>{pin.item.title}</span>
                <span className={s.pinItemMeta}>
                  {GANTRY_STAGE_LABELS[pin.item.stage]}
                  {pin.note && <> &middot; &ldquo;{pin.note.slice(0, 48)}{pin.note.length > 48 ? '…' : ''}&rdquo;</>}
                </span>
              </div>
              <button
                type="button"
                className={s.unPinBtn}
                onClick={(e) => { e.stopPropagation(); onSelect(pin.item.uid); }}
              >
                Unpin &amp; place
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
                  <path d="M2.5 6h7m0 0L7 3.5M9.5 6L7 8.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </li>
          ))}
        </ul>

        <div className={s.footer}>
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden>
            <circle cx="6.5" cy="6.5" r="5.5" stroke="currentColor" strokeWidth="1.2" />
            <path d="M6.5 5.5v4M6.5 4.25v.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          Net change: 0 pins — one out, one in.
        </div>
      </div>
    </>
  );
}
