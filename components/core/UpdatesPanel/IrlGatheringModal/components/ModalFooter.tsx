'use client';

import s from '../IrlGatheringModal.module.scss';

interface ModalFooterProps {
  onClose: () => void;
  onGoingClick?: () => void;
  isSubmit?: boolean;
  isLoading?: boolean;
  isEditMode?: boolean;
}

export function ModalFooter({ onClose, onGoingClick, isSubmit = false, isLoading = false, isEditMode = false }: ModalFooterProps) {
  const getButtonText = () => {
    if (isLoading) {
      return isEditMode ? 'Saving...' : 'Submitting...';
    }
    return isEditMode ? 'Save' : "I'm Going";
  };

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
        {getButtonText()}
      </button>
    </div>
  );
}

