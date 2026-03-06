import React from 'react';
import { useFormContext } from 'react-hook-form';
import clsx from 'clsx';

import s from './EditOfficeHoursMobileControls.module.scss';

interface Props {
  alwaysEnabled?: boolean;
}

export const EditOfficeHoursMobileControls = ({ alwaysEnabled }: Props = {}) => {
  const {
    formState: { isSubmitting, isDirty, isValidating },
  } = useFormContext();

  const isDisabled = isSubmitting || isValidating;

  return (
    <div
      className={clsx(s.root, {
        [s.visible]: alwaysEnabled || isDirty,
      })}
    >
      <button className={s.primaryButton} type="submit" disabled={isDisabled}>
        {isSubmitting ? 'Processing...' : 'Save'}
      </button>
    </div>
  );
};
