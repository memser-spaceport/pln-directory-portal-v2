import React, { ReactNode, useEffect, useId, useRef, useState } from 'react';
import { useFormContext } from 'react-hook-form';

import { CloseIcon } from '@/components/icons';
import { Button } from '@/components/common/Button';
import { UnsavedEditPopup, useUnsavedEdits, type UnsavedEntry } from '@/components/common/profile/UnsavedEdits';

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
   * `null` everywhere without a provider, which is everywhere except the two job
   * drawers — the other call sites across team-details and demo-day are
   * unaffected.
   *
   * This component is the right place for it because it is the only thing every
   * edit form in the app has in common, it already computes `isDirty`, and it
   * **mounts only while an editor is open** (every form is conditionally
   * rendered), so being mounted already means being edited.
   */
  const unsaved = useUnsavedEdits();
  const id = useId();
  const rootRef = useRef<HTMLDivElement>(null);

  /* The registry reads this by mutation, never through React, so that going
     dirty does not re-render the drawer on a keystroke. Note `isDirty` is still
     read during *render* above — react-hook-form's `formState` is a Proxy that
     only subscribes to the fields something touched while rendering, so moving
     that read into this effect would quietly make it always `false` and the
     guard would never fire. */
  const entryRef = useRef<UnsavedEntry>({
    id,
    isDirty: false,
    getElement: () => rootRef.current,
  });

  useEffect(() => {
    entryRef.current.isDirty = Boolean(isDirty);
  }, [isDirty]);

  useEffect(() => unsaved?.register(entryRef.current), [unsaved]);

  /* The anchor is captured into state rather than read from the ref at render
     time, because `react-hooks/refs` forbids the latter — and because the popup
     needs a value floating-ui can react to. */
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  useEffect(() => {
    setAnchor(rootRef.current);
  }, []);

  /* Derived, not stored. The popup is only ever on screen while this form is
     BOTH the flagged one and still dirty, so saving or cancelling takes it away
     without anything having to remember to. */
  const showPopup = Boolean(unsaved && unsaved.flaggedId === id && isDirty);

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
      {showPopup && <UnsavedEditPopup anchor={anchor} onDismiss={unsaved!.clearFlag} />}
    </div>
  );
};
