import React from 'react';
import { useFormContext } from 'react-hook-form';

import s from './EditFormControls.module.scss';

interface Props {
  onClose: () => void;
  title: string;
}

export const EditFormControls = ({ title, onClose }: Props) => {
  const {
    reset,
    formState: { isSubmitting },
  } = useFormContext();

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
        <button className={s.primaryButton} type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Processing... ' : 'Save'}
        </button>
      </div>
    </div>
  );
};
