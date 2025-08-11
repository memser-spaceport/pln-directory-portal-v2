import React from 'react';
import { useFormContext } from 'react-hook-form';
import clsx from 'clsx';

import s from './EditOfficeHoursMobileControls.module.scss';

export const EditOfficeHoursMobileControls = () => {
  const {
    formState: { isSubmitting, isDirty, isValid, isValidating },
  } = useFormContext();

  const isDisabled = isSubmitting || isValidating;

  return (
    <div
      className={clsx(s.root, {
        [s.visible]: isDirty,
      })}
    >
      <button className={s.primaryButton} type="submit" disabled={isDisabled}>
        {isSubmitting ? 'Processing...' : 'Save'}
      </button>
    </div>
  );
};
