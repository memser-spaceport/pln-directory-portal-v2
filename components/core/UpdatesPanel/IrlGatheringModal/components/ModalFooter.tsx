'use client';

import s from '../IrlGatheringModal.module.scss';

interface ModalFooterProps {
  onClose: () => void;
  onGoingClick?: () => void;
}

export function ModalFooter({ onClose, onGoingClick }: ModalFooterProps) {
  return (
    <div className={s.footer}>
      <button className={s.cancelButton} onClick={onClose}>
        Cancel
      </button>
      <button className={s.goingButton} onClick={onGoingClick}>
        I&apos;m Going
      </button>
    </div>
  );
}

