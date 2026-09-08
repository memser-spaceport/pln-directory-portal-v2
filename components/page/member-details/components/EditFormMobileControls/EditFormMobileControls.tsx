import clsx from 'clsx';
import React from 'react';
import { useFormContext } from 'react-hook-form';

import s from './EditFormMobileControls.module.scss';

interface Props {
  /**
   * Show the bar whether or not the form has been touched.
   *
   * The default — appear once something has changed — is right for a form that
   * starts as a copy of what is already saved, where an untouched Save would do
   * nothing. It is wrong for one that opens with something worth saving already
   * in it: the CV import review is a parse with its rows *already ticked*, so
   * somebody who agrees with every one of them never dirties the form and, on a
   * phone, would never see a Save at all. Mirrors `alwaysEnabled` on
   * `EditOfficeHoursFormControls`, which that card passes for the same reason.
   */
  alwaysEnabled?: boolean;
}

export const EditFormMobileControls = ({ alwaysEnabled }: Props = {}) => {
  const {
    formState: { isSubmitting, isDirty, isValid },
  } = useFormContext();

  return (
    <div
      className={clsx(s.root, {
        [s.visible]: isDirty || alwaysEnabled,
      })}
    >
      <button className={s.primaryButton} type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Processing... ' : 'Save'}
      </button>
    </div>
  );
};
