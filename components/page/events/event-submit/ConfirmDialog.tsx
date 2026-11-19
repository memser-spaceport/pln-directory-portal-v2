'use client';

import { useId } from 'react';

import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';

import s from './ConfirmDialog.module.scss';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  text: string;
  confirmLabel: string;
  /** A destructive confirm (delete) is drawn in the error colour. */
  danger?: boolean;
  /** The confirm is running: both buttons are disabled. */
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** A question with "Cancel" and one confirm, asked before the form is cleared or an event is deleted. */
export function ConfirmDialog({
  isOpen,
  title,
  text,
  confirmLabel,
  danger,
  busy,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const titleId = useId();
  return (
    <Modal isOpen={isOpen} onClose={busy ? undefined : onCancel} ariaLabelledBy={titleId} lockScroll inertBackground>
      <div className={s.dialog}>
        <h2 id={titleId} className={s.title}>
          {title}
        </h2>
        <p className={s.text}>{text}</p>
        <div className={s.actions}>
          <Button type="button" style="border" variant="neutral" size="s" disabled={busy} onClick={onCancel}>
            Cancel
          </Button>
          <Button type="button" variant={danger ? 'error' : 'primary'} size="s" disabled={busy} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
