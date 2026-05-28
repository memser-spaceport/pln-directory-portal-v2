'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import dialogStyles from '@/components/core/ConfirmDialog/ConfirmDialog.module.css';
import s from './DeclineIdeaModal.module.scss';

interface Props {
  readonly isOpen: boolean;
  readonly isPending?: boolean;
  readonly onClose: () => void;
  readonly onConfirm: (reason: string) => void | Promise<void>;
}

export function DeclineIdeaModal({ isOpen, isPending, onClose, onConfirm }: Props) {
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setReason('');
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const trimmed = reason.trim();
  const canConfirm = trimmed.length > 0 && !isPending;

  const handleConfirm = () => {
    if (!canConfirm) return;
    void onConfirm(trimmed);
  };

  return (
    <div className={dialogStyles.modal}>
      <div className={dialogStyles.modalContent}>
        <button type="button" className={dialogStyles.closeButton} onClick={onClose} aria-label="Close">
          <Image height={20} width={20} alt="" loading="lazy" src="/icons/close.svg" />
        </button>
        <h2>Decline idea?</h2>
        <p className={dialogStyles.confirmationMessage}>Why is this not being taken forward?</p>
        <div className={dialogStyles.formContentWrapper}>
          <label htmlFor="gantry-decline-reason">Reason</label>
          <textarea
            id="gantry-decline-reason"
            className={s.reasonInput}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Share why this idea won't be pursued…"
            rows={4}
            maxLength={2000}
            disabled={isPending}
            autoFocus
          />
        </div>
        <div className={dialogStyles.dialogControls}>
          <button type="button" className={dialogStyles.secondaryButton} onClick={onClose} disabled={isPending}>
            Cancel
          </button>
          <button
            type="button"
            className={dialogStyles.errorButton}
            onClick={handleConfirm}
            disabled={!canConfirm}
          >
            {isPending ? 'Declining...' : 'Decline'}
          </button>
        </div>
      </div>
    </div>
  );
}
