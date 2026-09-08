import React, { ReactNode } from 'react';
import { useFormContext } from 'react-hook-form';

import { CloseIcon } from '@/components/icons';
import { Button } from '@/components/common/Button';
import { UnsavedEditPopup, useUnsavedEditRegistration } from '@/components/common/profile/UnsavedEdits';

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

  /**
   * Tell a surrounding drawer that this form is half-edited, so leaving can be
   * refused rather than silently throwing the edit away.
   *
   * Inert without a provider, which is everywhere except the two job drawers.
   * This component is one of the two places worth doing it from: it mounts only
   * while an editor is open (every form is conditionally rendered), so being
   * mounted already means being edited. `EditOfficeHoursFormControls` is the
   * other, and must stay in step — one form picks between them by variant.
   *
   * Note `isDirty` is read during *render* above. react-hook-form's `formState`
   * is a Proxy that subscribes only to what was touched while rendering, so
   * reading it for the first time inside the hook's effect would make it
   * permanently `false` and the guard would never fire.
   */
  const { rootRef, anchor, showPopup, dismissPopup } = useUnsavedEditRegistration(Boolean(isDirty));

  const cancel = () => {
    if (reset) {
      reset();
    }
    onClose();
  };

  const isProcessing = isSubmitting || pIsProcessing;

  return (
    <div className={s.root} ref={rootRef}>
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
      {showPopup && <UnsavedEditPopup anchor={anchor} onDismiss={dismissPopup} />}
    </div>
  );
};
