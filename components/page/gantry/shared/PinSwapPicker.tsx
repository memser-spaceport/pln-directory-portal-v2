'use client';

import { useState } from 'react';
import dialogStyles from '@/components/core/ConfirmDialog/ConfirmDialog.module.css';
import { GANTRY_STAGE_LABELS } from '@/services/gantry/constants';
import type { GantryUserPin } from '@/services/gantry/types';
import s from './PinSwapPicker.module.scss';

interface Props {
  readonly targetItemTitle: string;
  readonly pins: GantryUserPin[];
  readonly onSelect: (swapItemUid: string) => void;
  readonly onDismiss: () => void;
}

export function PinSwapPicker({ targetItemTitle, pins, onSelect, onDismiss }: Props) {
  const [selectedUid, setSelectedUid] = useState<string | null>(null);

  const handleConfirm = () => {
    if (!selectedUid) return;
    onSelect(selectedUid);
  };

  return (
    <div className={dialogStyles.modal}>
      <div className={dialogStyles.modalContent}>
        <button type="button" className={dialogStyles.closeButton} onClick={onDismiss} aria-label="Close" />
        <h2 className={s.heading}>Your pin limit is full</h2>
        <p className={s.sub}>
          Select a pin to release to make room for &ldquo;{targetItemTitle}&rdquo;
        </p>

        <ul className={s.pinList}>
          {pins.map((pin) => (
            <li key={pin.uid}>
              <button
                type="button"
                className={`${s.pinRow} ${selectedUid === pin.item.uid ? s.pinRowSelected : ''}`}
                onClick={() => setSelectedUid(pin.item.uid)}
              >
                <span className={s.pinItemTitle}>{pin.item.title}</span>
                <span className={s.pinItemStage}>{GANTRY_STAGE_LABELS[pin.item.stage]}</span>
                {pin.note && <span className={s.pinItemNote}>&ldquo;{pin.note}&rdquo;</span>}
              </button>
            </li>
          ))}
        </ul>

        <div className={dialogStyles.dialogControls}>
          <button type="button" className={dialogStyles.secondaryButton} onClick={onDismiss}>
            Cancel
          </button>
          <button
            type="button"
            className={dialogStyles.primaryButton}
            onClick={handleConfirm}
            disabled={!selectedUid}
          >
            Release &amp; Pin
          </button>
        </div>
      </div>
    </div>
  );
}
