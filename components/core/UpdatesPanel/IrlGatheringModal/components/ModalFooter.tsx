'use client';

import s from '../IrlGatheringModal.module.scss';
import { useIrlAnalytics } from '@/analytics/irl.analytics';
import { GatheringData } from '../types';

interface ModalFooterProps {
  onClose: () => void;
  onGoingClick?: () => void;
  isSubmit?: boolean;
  isLoading?: boolean;
  isEditMode?: boolean;
  isLoggedIn?: boolean;
  onLoginClick?: () => void;
  shouldAnimate?: boolean;
  gatheringData?: GatheringData;
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
  gatheringData,
}: ModalFooterProps) {
  const analytics = useIrlAnalytics();

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
      if (gatheringData) {
        analytics.trackGatheringModalLoginToRespondClicked(gatheringData);
      }
      onLoginClick();
    } else if (!isSubmit && onGoingClick) {
      onGoingClick();
    }
  };

  const handleCancelClick = () => {
    if (gatheringData) {
      analytics.trackGatheringModalCancelClicked(gatheringData, isEditMode);
    }
    onClose();
  };

  return (
    <div className={s.footer}>
      <button type="button" className={s.cancelButton} onClick={handleCancelClick} disabled={isLoading}>
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
