'use client';

import { createContext, PropsWithChildren, ReactNode, Ref, useContext, useEffect } from 'react';
import clsx from 'clsx';
import { useFormContext } from 'react-hook-form';

import { Button } from '@/components/common/Button';
// The title's type and the buttons' 100px minimum are production's own —
// `EditFormControls` is the row this splits in two, so it keeps that row's sheet.
import ec from '@/components/common/profile/EditFormControls/EditFormControls.module.scss';
import { getSaveBtnLabel } from '@/components/common/profile/EditFormControls/utils/getSaveBtnLabel';
// `DetailsSection.editView` ships a gradient tint; ContactDetails overrides it to
// the flat `#f2f5ff` + `#aebfff` pair the header card already wears, and that
// override is passed back in through `classes` exactly as ContactDetails does.
import c from '@/components/page/member-details/ContactDetails/ContactDetails.module.scss';

import s from './SectionEditor.module.scss';

/**
 * **How a card on the member profile swaps itself for its editor.**
 *
 * One pattern with several parts that go together, shared by the two pages
 * that edit a profile section in place — the filled profile
 * (`member-profile-edit`, where it was worked out) and the brand-new one
 * (`onboarding`, which took it whole rather than copying its shell):
 *
 *  - `Section` — one card's wrapper: muted (`inert` + faded) while another
 *    card is open, carrying the ref the floating status bar watches while
 *    this one is;
 *  - `SectionEditorTitle` above the fields and `SectionEditorControls`
 *    (Cancel/Save) below them — production's `EditFormControls` row split in
 *    two so the pair sits at the end of the work;
 *  - `EditorDirtyContext`, how the page learns the open form has unsaved
 *    changes, for the bar's Save;
 *  - `editSectionClasses`, the flat brand tint plus the in-flow override for
 *    an open `DetailsSection`;
 *  - `SECTION_NAMES` / `editorStatus` / `editKey`, what the bar says and
 *    what it re-attaches on.
 *
 * The forms themselves are in `forms.tsx` beside this file.
 *
 * Production's `EditFormControls` is one row: the title on the left, Cancel and
 * Save on the right, *above* the fields. This splits that row into two pieces
 * so the controls can sit *after* the fields instead:
 *
 *   form › SectionEditorTitle + .body(rows) + SectionEditorControls
 *
 * Same title, same two buttons, same dirty rule — `getSaveBtnLabel` still turns
 * Save into "No Changes" until something is typed — only the position moved.
 * Two components rather than one with a slot, because the fields between them
 * belong to each form and there is nothing for a shared shell to own.
 */

/**
 * Which section editor a host has open. Each host keeps its own `EditTarget`
 * union over this (the new-member page adds the CV import to it); this is the
 * part the two share, and the part `editKey` and `editorStatus` read. `uid:
 * null` on Experience means a new entry.
 */
export type SectionEditTarget =
  | { kind: 'profile' }
  | { kind: 'office-hours' }
  | { kind: 'contact' }
  | { kind: 'experience'; uid: string | null };

export type SectionKind = SectionEditTarget['kind'];

/** A string the floating status bar can re-attach on when one editor gives way to another. */
export const editKey = (target: SectionEditTarget | null): string | null => {
  if (!target) return null;
  return target.kind === 'experience' ? `experience:${target.uid ?? 'new'}` : target.kind;
};

/** The open card's name as its own section header spells it — what the status bar says you left. */
export const SECTION_NAMES: Record<SectionKind, string> = {
  profile: 'Profile',
  'office-hours': 'Office Hours',
  contact: 'Contact Details',
  experience: 'Experience',
};

/**
 * What the status bar reports. Names the card, because that is the one thing
 * the bar knows that its buttons do not — a person who scrolled away is told
 * what they left open. Once there is something to save it says so, since the
 * unsaved state is what the bar is asking about.
 */
export const editorStatus = (target: SectionEditTarget | null, dirty: boolean): string => {
  const name = target ? SECTION_NAMES[target.kind] : '';
  return dirty ? `Unsaved changes in ${name}` : `Editing ${name}`;
};

/**
 * The flat brand tint plus the in-flow override, for a `DetailsSection` that
 * is open. `undefined` at rest so `c.root`'s zero padding never reaches a
 * resting card.
 */
export const editSectionClasses = (open: boolean) =>
  open ? { root: c.root, editView: clsx(c.editView, s.editCard) } : undefined;

/** The header card's classes while it is open — `ProfileDetails` carries its own edit tint. */
export const editCardClass = s.editCard;

/**
 * One card's wrapper. `inert` is the whole mechanism for "the other sections
 * are disabled": the browser drops every click, focus and tab stop inside it,
 * and assistive tech skips it. The class only paints what `inert` did. The ref
 * lands here rather than on the card because `DetailsSection` forwards none,
 * and the wrapper is the card's outline in every way that matters to the
 * observer.
 *
 * `className` is for a host whose column needs the wrapper to state a width:
 * the apply drawer centres its children, so an unstyled div shrinks to its
 * content and the card inside it loses 64px the moment it is wrapped (the
 * same reason `ImportLock`'s `.wrap` exists). The profile pages pass none.
 */
export function Section({
  muted,
  ref,
  className,
  children,
}: PropsWithChildren<{ muted: boolean; ref?: Ref<HTMLDivElement>; className?: string }>) {
  return (
    <div
      ref={ref}
      className={clsx(s.section, className, muted && s.muted)}
      inert={muted}
      aria-disabled={muted || undefined}
    >
      {children}
    </div>
  );
}

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
