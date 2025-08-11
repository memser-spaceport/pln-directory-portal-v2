import React from 'react';
import { useFormContext } from 'react-hook-form';

import s from './EditOfficeHoursFormControls.module.scss';

interface Props {
  onClose: () => void;
  title: string;
  isValidatingOfficeHours: boolean;
}

export const EditOfficeHoursFormControls = ({ title, onClose, isValidatingOfficeHours }: Props) => {
  const {
    reset,
    formState: { isSubmitting, isDirty, isValid },
  } = useFormContext();

  const isDisabled = isSubmitting || !isDirty || !isValid || isValidatingOfficeHours;

  return (
    <div className={s.root}>
      <div className={s.title}>{title}</div>
      <div className={s.controls}>
        <button
          className={s.secondaryButton}
          onClick={() => {
            reset();
            onClose();
          }}
          type="button"
        >
          Cancel
        </button>
        <button className={s.primaryButton} type="submit" disabled={isDisabled}>
          {isSubmitting ? 'Processing...' : 'Save'}
        </button>
      </div>
      <button
        className={s.mobileCloseButton}
        onClick={() => {
          reset();
          onClose();
        }}
        type="button"
      >
        <CloseIcon />
      </button>
    </div>
  );
};

const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M16.2887 14.962C16.4649 15.1381 16.5638 15.377 16.5638 15.626C16.5638 15.8751 16.4649 16.114 16.2887 16.2901C16.1126 16.4662 15.8737 16.5652 15.6247 16.5652C15.3756 16.5652 15.1367 16.4662 14.9606 16.2901L10.0005 11.3284L5.03874 16.2885C4.86261 16.4647 4.62374 16.5636 4.37467 16.5636C4.1256 16.5636 3.88673 16.4647 3.71061 16.2885C3.53449 16.1124 3.43555 15.8735 3.43555 15.6245C3.43555 15.3754 3.53449 15.1365 3.71061 14.9604L8.67233 10.0003L3.71217 5.03854C3.53605 4.86242 3.43711 4.62355 3.43711 4.37448C3.43711 4.12541 3.53605 3.88654 3.71217 3.71042C3.88829 3.53429 4.12716 3.43535 4.37624 3.43535C4.62531 3.43535 4.86418 3.53429 5.0403 3.71042L10.0005 8.67213L14.9622 3.70963C15.1383 3.53351 15.3772 3.43457 15.6262 3.43457C15.8753 3.43457 16.1142 3.53351 16.2903 3.70963C16.4664 3.88575 16.5654 4.12462 16.5654 4.3737C16.5654 4.62277 16.4664 4.86164 16.2903 5.03776L11.3286 10.0003L16.2887 14.962Z"
      fill="#455468"
    />
  </svg>
);
