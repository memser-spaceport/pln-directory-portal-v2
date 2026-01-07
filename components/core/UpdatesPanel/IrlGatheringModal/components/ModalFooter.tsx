'use client';

import s from '../IrlGatheringModal.module.scss';

interface ModalFooterProps {
  onClose: () => void;
  onGoingClick?: () => void;
  isSubmit?: boolean;
}

export function ModalFooter({ onClose, onGoingClick, isSubmit = false }: ModalFooterProps) {
  return (
    <div className={s.footer}>
      <button type="button" className={s.cancelButton} onClick={onClose}>
        Cancel
      </button>
      <button
        type={isSubmit ? 'submit' : 'button'}
        className={s.goingButton}
        onClick={isSubmit ? undefined : onGoingClick}
      >
        I&apos;m Going
      </button>
    </div>
  );
}

