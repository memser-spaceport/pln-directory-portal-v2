import React from 'react';
import { useFormContext } from 'react-hook-form';
import clsx from 'clsx';

import s from './EditOfficeHoursMobileControls.module.scss';

interface Props {
  isValidatingOfficeHours: boolean;
}

export const EditOfficeHoursMobileControls = ({ isValidatingOfficeHours }: Props) => {
  const {
    formState: { isSubmitting, isDirty, isValid },
  } = useFormContext();

  const isDisabled = isSubmitting || !isValid || isValidatingOfficeHours;

  return (
    <div
      className={clsx(s.root, {
        [s.visible]: isDirty,
      })}
    >
      <button className={s.primaryButton} type="submit" disabled={isDisabled}>
        {isSubmitting ? 'Processing...' : isValidatingOfficeHours ? 'Validating...' : 'Save'}
      </button>
    </div>
  );
};
