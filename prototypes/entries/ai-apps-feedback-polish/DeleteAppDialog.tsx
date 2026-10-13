'use client';

import { Modal } from '@/components/common/Modal/Modal';
import { Button } from '@/components/common/Button/Button';

import s from './DeleteAppDialog.module.scss';

interface Props {
  isOpen: boolean;
  appName: string;
  onClose: () => void;
  onConfirm: () => void;
}

/**
 * Destructive confirm for deleting an app. Kept as its own isolated surface —
 * never a tab or a field next to the edit form — so a delete is always a
 * deliberate, single-purpose action.
 */
export function DeleteAppDialog({ isOpen, appName, onClose, onConfirm }: Props) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} className={s.modal}>
      <div className={s.content}>
        <h2 className={s.title}>Delete “{appName}”?</h2>
        <p className={s.body}>
          This removes the app and its deployment for everyone. Any 1-pager and stored secrets are deleted too. This
          can’t be undone.
        </p>
        <div className={s.actions}>
          <Button style="border" variant="neutral" size="s" onClick={onClose}>
            Cancel
          </Button>
          <Button style="fill" variant="error" size="s" onClick={onConfirm}>
            Delete app
          </Button>
        </div>
      </div>
    </Modal>
  );
}
