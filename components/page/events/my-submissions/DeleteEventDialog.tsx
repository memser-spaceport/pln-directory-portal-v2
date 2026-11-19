'use client';

import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';

import s from './DeleteEventDialog.module.scss';

interface Props {
  isOpen: boolean;
  /** The delete is running: both buttons are off and the dialog stays open. */
  deleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

const TITLE_ID = 'delete-event-dialog-title';

/** Asks before an event is deleted. */
export function DeleteEventDialog({ isOpen, deleting, onCancel, onConfirm }: Props) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={deleting ? undefined : onCancel}
      ariaLabelledBy={TITLE_ID}
      lockScroll
      inertBackground
      className={s.dialog}
    >
      <h2 id={TITLE_ID} className={s.title}>
        Are you sure you want to delete?
      </h2>
      <p className={s.text}>Clicking delete will remove the event from the list.</p>
      <div className={s.footer}>
        <Button style="border" variant="neutral" size="s" disabled={deleting} onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="error" size="s" disabled={deleting} onClick={onConfirm}>
          Delete
        </Button>
      </div>
    </Modal>
  );
}
