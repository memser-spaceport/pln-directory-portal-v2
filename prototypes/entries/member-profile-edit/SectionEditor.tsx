'use client';

import { createContext, ReactNode, useContext, useEffect } from 'react';
import clsx from 'clsx';
import { useFormContext } from 'react-hook-form';

import { Button } from '@/components/common/Button';
// The title's type and the buttons' 100px minimum are production's own —
// `EditFormControls` is the row this splits in two, so it keeps that row's sheet.
import ec from '@/components/common/profile/EditFormControls/EditFormControls.module.scss';
import { getSaveBtnLabel } from '@/components/common/profile/EditFormControls/utils/getSaveBtnLabel';

import s from './MemberProfileEdit.module.scss';

/**
 * Production's `EditFormControls` is one row: the title on the left, Cancel and
 * Save on the right, *above* the fields. This entry splits that row into two
 * pieces so the controls can sit *after* the fields instead:
 *
 *   form › SectionEditorTitle + .body(rows) + SectionEditorControls
 *
 * Same title, same two buttons, same dirty rule — `getSaveBtnLabel` still turns
 * Save into "No Changes" until something is typed — only the position moved.
 * Two components rather than one with a slot, because the fields between them
 * belong to each form and there is nothing for a shared shell to own.
 */

/**
 * How the page learns whether the open editor has unsaved changes, without
 * each of the four forms growing a prop for it. The controls row is the one
 * component every form renders inside its `FormProvider`, so it is the one
 * place that can read `isDirty` and pass it up. The page provides the setter;
 * the floating Save reads the result. `null` where no page is listening.
 */
export const EditorDirtyContext = createContext<((dirty: boolean) => void) | null>(null);

export function SectionEditorTitle({ title }: { title: ReactNode }) {
  return (
    <div className={s.editorHead}>
      <div className={ec.title}>{title}</div>
    </div>
  );
}

interface ControlsProps {
  onClose: () => void;
  /**
   * Save is live before anything is typed. Production's default disables Save
   * and labels it "No Changes" until the form is dirty — right for editing a
   * filled section, wrong for a form that is empty by definition (a new
   * Experience entry), where the first thing read would be a button saying
   * there is nothing to do. Same flag, same reason, as
   * `EditOfficeHoursFormControls.alwaysEnabled`.
   */
  alwaysEnabled?: boolean;
}

export function SectionEditorControls({ onClose, alwaysEnabled }: ControlsProps) {
  const {
    reset,
    getValues,
    formState: { dirtyFields, defaultValues, isSubmitting },
  } = useFormContext();
  const reportDirty = useContext(EditorDirtyContext);

  /* "Changed" as a person means it, not as the form's byte comparison has it.

     `formState.isDirty` deep-compares every value against the defaults, and
     the rich-text field (Quill, via `FormEditor`) re-serializes its value the
     moment it mounts: an empty description becomes `<p><br></p>`, and this
     Quill build writes every space in a seeded bio as `&nbsp;`. So the two
     editors that hold one read as dirty before anyone has typed, and both the
     row's Save and the floating "Save changes" lit up on open.

     Two filters, in order. `dirtyFields` honours `FormEditor`'s own guard (it
     only marks the field once real content has been entered), which clears the
     empty-description case. Then a dirty string field whose current and
     default values differ only in how whitespace is encoded is not dirty — that
     is the `&nbsp;` case, and it is the only difference a mount can introduce
     to text nobody has touched. */
  const sameText = (a: unknown, b: unknown) =>
    typeof a === 'string' &&
    typeof b === 'string' &&
    a
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim() ===
      b
        .replace(/&nbsp;/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
  const isDirty = Object.keys(dirtyFields ?? {}).some(
    (field) => !sameText(getValues(field), (defaultValues as Record<string, unknown> | undefined)?.[field]),
  );

  /* Up to the page, and back to "clean" when the editor unmounts — a Save or a
     Cancel closes the form, and the floating control must not keep offering to
     save an editor that is gone. */
  useEffect(() => {
    reportDirty?.(isDirty);
    return () => reportDirty?.(false);
  }, [isDirty, reportDirty]);

  const label = alwaysEnabled
    ? isSubmitting
      ? 'Processing... '
      : 'Save'
    : getSaveBtnLabel({ isDirty, isProcessing: isSubmitting });

  return (
    <div className={s.editorFooter}>
      <Button
        size="s"
        style="border"
        type="button"
        className={clsx(ec.btn, s.footerBtn)}
        onClick={() => {
          /* Production's Cancel: reset, then close. The form unmounts with the
             card, so the reset is belt-and-braces — kept because it is what
             the real control does, and a copy that quietly drops a step is how
             two controls start to differ. */
          reset();
          onClose();
        }}
      >
        Cancel
      </Button>
      <Button
        size="s"
        type="submit"
        disabled={isSubmitting || (!alwaysEnabled && !isDirty)}
        className={clsx(ec.btn, s.footerBtn)}
      >
        {label}
      </Button>
    </div>
  );
}
