'use client';

import s from '../IrlGatheringModal.module.scss';

interface ModalFooterProps {
  onClose: () => void;
  onGoingClick?: () => void;
  isSubmit?: boolean;
  isLoading?: boolean;
  isEditMode?: boolean;
  isLoggedIn?: boolean;
  onLoginClick?: () => void;
  shouldAnimate?: boolean;
}

export function ModalFooter({
  onClose,
  onGoingClick,
  isSubmit = false,
  isLoading = false,
  isEditMode = false,
  isLoggedIn = true,
  onLoginClick,
  shouldAnimate = false,
}: ModalFooterProps) {
  const getButtonText = () => {
    if (!isLoggedIn) {
      return 'Log in to Respond';
    }
    if (isLoading) {
      return isEditMode ? 'Saving...' : 'Submitting...';
    }
    return 'Submit';
  };

  const handleButtonClick = () => {
    if (!isLoggedIn && onLoginClick) {
      onLoginClick();
    } else if (!isSubmit && onGoingClick) {
      onGoingClick();
    }
  };

  return (
    <div className={s.footer}>
      <button type="button" className={s.cancelButton} onClick={onClose} disabled={isLoading}>
        Cancel
      </button>
      <button
        type={isSubmit && isLoggedIn ? 'submit' : 'button'}
        className={`${s.goingButton} ${shouldAnimate ? s.goingButtonAnimate : ''}`}
        onClick={isSubmit && isLoggedIn ? undefined : handleButtonClick}
        disabled={isLoading}
      >
        {getButtonText()}
      </button>
    </div>
  );
}
