import clsx from 'clsx';
import React from 'react';
import { useFormContext } from 'react-hook-form';

import s from './EditFormMobileControls.module.scss';

export const EditFormMobileControls = () => {
  const {
    formState: { isSubmitting, isDirty, isValid },
  } = useFormContext();

  return (
    <div
      className={clsx(s.root, {
        [s.visible]: isDirty,
      })}
    >
      <button className={s.primaryButton} type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Processing... ' : 'Save'}
      </button>
    </div>
  );
};
