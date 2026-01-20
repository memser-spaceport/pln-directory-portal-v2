'use client';

import s from '../IrlGatheringModal.module.scss';

interface ModalFooterProps {
  onClose: () => void;
  onGoingClick?: () => void;
  isSubmit?: boolean;
  isLoading?: boolean;
}

export function ModalFooter({ onClose, onGoingClick, isSubmit = false, isLoading = false }: ModalFooterProps) {
  return (
    <div className={s.footer}>
      <button type="button" className={s.cancelButton} onClick={onClose} disabled={isLoading}>
        Cancel
      </button>
      <button
        type={isSubmit ? 'submit' : 'button'}
        className={s.goingButton}
        onClick={isSubmit ? undefined : onGoingClick}
        disabled={isLoading}
      >
        {isLoading ? 'Submitting...' : "I'm Going"}
      </button>
    </div>
  );
}

