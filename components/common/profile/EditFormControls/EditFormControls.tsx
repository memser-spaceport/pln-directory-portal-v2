import React, { ReactNode } from 'react';
import { useFormContext } from 'react-hook-form';

import { CloseIcon } from '@/components/icons';
import { Button } from '@/components/common/Button';

import { getSaveBtnLabel } from './utils/getSaveBtnLabel';

import s from './EditFormControls.module.scss';

interface Props {
  onClose: () => void;
  title: ReactNode;
  isProcessing?: boolean;
}

export const EditFormControls = (props: Props) => {
  const { title, onClose, isProcessing: pIsProcessing = false } = props;

  const { reset, formState } = useFormContext() || {};
  const { isSubmitting, isDirty } = formState || {};

  const cancel = () => {
    if (reset) {
      reset();
    }
    onClose();
  };

  const isProcessing = isSubmitting || pIsProcessing;

  return (
    <div className={s.root}>
      <div className={s.title}>{title}</div>
      <div className={s.controls}>
        <Button size="s" style="border" onClick={cancel} type="button" className={s.btn}>
          Cancel
        </Button>
        <Button size="s" type="submit" disabled={isProcessing || !isDirty} className={s.btn}>
          {getSaveBtnLabel({ isDirty, isProcessing })}
        </Button>
      </div>
      <button className={s.mobileCloseButton} onClick={cancel} type="button">
        <CloseIcon className={s.closeIcon} />
      </button>
    </div>
  );
};
