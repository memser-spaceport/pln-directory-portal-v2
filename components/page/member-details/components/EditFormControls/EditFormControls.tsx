import React from 'react';
import { useFormContext } from 'react-hook-form';

import { CloseIcon } from '@/components/icons';
import { Button } from '@/components/common/Button';

import { getSaveBtnLabel } from './utils/getSaveBtnLabel';

import s from './EditFormControls.module.scss';

interface Props {
  onClose: () => void;
  title: string;
}

export const EditFormControls = ({ title, onClose }: Props) => {
  const {
    reset,
    formState: { isSubmitting, isDirty, isValid },
  } = useFormContext();

  const cancel = () => {
    reset();
    onClose();
  };

  return (
    <div className={s.root}>
      <div className={s.title}>{title}</div>
      <div className={s.controls}>
        <Button size="s" style="border" onClick={cancel} type="button" className={s.btn}>
          Cancel
        </Button>
        <Button size="s" type="submit" disabled={isSubmitting || !isDirty || !isValid} className={s.btn}>
          {getSaveBtnLabel({ isDirty, isSubmitting })}
        </Button>
      </div>
      <button className={s.mobileCloseButton} onClick={cancel} type="button">
        <CloseIcon className={s.closeIcon} />
      </button>
    </div>
  );
};
