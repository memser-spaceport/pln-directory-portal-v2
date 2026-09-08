'use client';

import { RefObject, useEffect, useState } from 'react';
import clsx from 'clsx';

// The pill itself — position, size, fill, shadow, entrance — is the AI Apps
// floating feedback control's, imported rather than re-drawn. Same job: a
// control that has to stay in reach while the person is somewhere else on the
// page. Its collapse-to-glyph behaviour is driven by a data attribute this
// component never sets, so the labels stay.
import fab from '@/components/page/ai-apps/components/FloatingFeedbackButton/FloatingFeedbackButton.module.scss';

import s from './MemberProfileEdit.module.scss';

interface Props {
  /** The card that is open for editing. Observed, and scrolled back to. */
  target: RefObject<HTMLElement | null>;
  /**
   * Which editor is open, or `null` for none. A key rather than a boolean so
   * the observers re-attach when one card closes and another opens in the
   * same render — the ref object is stable across that, and a boolean would
   * not have changed.
   */
  activeKey: string | null;
  /** Whether the open editor has unsaved changes — see `EditorDirtyContext`. */
  dirty: boolean;
}

/**
 * **The floating controls for an open editor you have scrolled away from.**
 *
 * Two buttons, each with its own reason to appear:
 *
 * - **Save changes** — whenever the editor has unsaved changes, wherever the
 *   person is on the page. It *is* the Cancel/Save row's Save, at a distance:
 *   pressing it submits the open form (`requestSubmit`, so validation runs and
 *   a failed field gets focus and scrolls itself into view exactly as if the
 *   row's Save had been pressed). It first appeared only while that row was
 *   off screen, on the argument that a visible Save needs no double; the
 *   person building this looked at a tall screen where the whole form fit,
 *   typed, and saw nothing — *"I don't see it now."* The button is a standing
 *   ask to save what has been typed, so it stands as long as there is
 *   something unsaved. Clean editors never get it: the row's own Save reads
 *   "No Changes" then, and a floating button that does nothing would be worse
 *   than none.
 *
 * - **Keep editing** — while the whole card is out of view, whatever its
 *   state. Scrolls the card back to the top of the view and puts focus in its
 *   first field. Beside Save it goes quiet (white pill), because saving is the
 *   thing the person is being asked to decide; alone, it is the one control
 *   and wears the brand fill.
 *
 * Keep editing shows only when *none* of the card is visible: a person who can
 * see the card is at the card, and a way back would be noise. `threshold: 0`
 * is exactly that rule.
 *
 * Floating rather than in a bar, because this is a control for someone
 * mid-task who has moved: the surface under them is whatever they scrolled to,
 * and the control has to stay in reach regardless. (Lesson 10's detail-view
 * case, not its grid case — there is no row on the page for it to join that
 * would be in view.)
 */
export function FloatingEditorControls({ target, activeKey, dirty }: Props) {
  /* Which editor's card is out of view — `null` for "none". Keyed rather than
     a boolean so a value left over from the last editor can never show the
     pill for the next one: it is only read against the key that is open now,
     and only the observer ever writes it. */
  const [cardAwayKey, setCardAwayKey] = useState<string | null>(null);

  useEffect(() => {
    const card = target.current;
    if (!activeKey || !card) return;
    const observer = new IntersectionObserver(([entry]) => setCardAwayKey(entry.isIntersecting ? null : activeKey), {
      threshold: 0,
    });
    observer.observe(card);
    return () => observer.disconnect();
  }, [activeKey, target]);

  if (!activeKey) return null;
  const showKeep = cardAwayKey === activeKey;
  const showSave = dirty;
  if (!showKeep && !showSave) return null;

  const back = () => {
    const el = target.current;
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    /* `preventScroll`, or the focus jump fights the smooth scroll and the card
       lands wherever the browser's own focus-scroll put it. The field is the
       first one the editor draws — the same place a fresh open would start. */
    const field = el.querySelector<HTMLElement>('input:not([type="hidden"]), textarea, [contenteditable="true"]');
    field?.focus({ preventScroll: true });
  };

  const save = () => {
    /* The open form's own submit, so the same validation and the same
       `onSubmit` run as for the row's Save. `requestSubmit` rather than
       `submit()`: the latter skips validation and React's handler alike. */
    target.current?.querySelector('form')?.requestSubmit();
  };

  return (
    <div className={clsx(fab.wrap, s.floatingRow)}>
      {showKeep && (
        <button
          type="button"
          className={clsx(fab.button, s.floatingBtn, showSave && s.floatingSecondary)}
          onClick={back}
        >
          <PencilIcon />
          <span className={fab.label}>Keep editing</span>
        </button>
      )}
      {showSave && (
        <button type="button" className={clsx(fab.button, s.floatingBtn)} onClick={save}>
          <CheckIcon />
          <span className={fab.label}>Save changes</span>
        </button>
      )}
    </div>
  );
}

/** `EditButton`'s pencil — the glyph the section's own Edit wears — so the way
 *  back reads as the same action it returns to. Fill handed to `currentColor`
 *  in the stylesheet; the source hardcodes it. */
const PencilIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 15" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
    <path
      d="M12.8789 1.35156L13.3984 1.87109C14 2.47266 14 3.42969 13.3984 4.03125L12.5781 4.85156L9.89844 2.17188L10.7188 1.35156C11.3203 0.75 12.2773 0.75 12.8789 1.35156ZM4.70312 7.36719L9.26953 2.80078L11.9492 5.48047L7.38281 10.0469C7.21875 10.2109 7 10.3477 6.78125 10.4297L4.34766 11.2227C4.12891 11.3047 3.85547 11.25 3.69141 11.0586C3.5 10.8945 3.44531 10.6211 3.52734 10.4023L4.32031 7.96875C4.40234 7.75 4.53906 7.53125 4.70312 7.36719ZM2.625 2.5H5.25C5.71484 2.5 6.125 2.91016 6.125 3.375C6.125 3.86719 5.71484 4.25 5.25 4.25H2.625C2.13281 4.25 1.75 4.66016 1.75 5.125V12.125C1.75 12.6172 2.13281 13 2.625 13H9.625C10.0898 13 10.5 12.6172 10.5 12.125V9.5C10.5 9.03516 10.8828 8.625 11.375 8.625C11.8398 8.625 12.25 9.03516 12.25 9.5V12.125C12.25 13.5742 11.0742 14.75 9.625 14.75H2.625C1.17578 14.75 0 13.5742 0 12.125V5.125C0 3.67578 1.17578 2.5 2.625 2.5Z"
      fill="currentColor"
    />
  </svg>
);

/** A plain 1.5px check, the mark every confirm in this product draws. */
const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
    <path
      d="M3 8.5L6.5 12L13 4.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
