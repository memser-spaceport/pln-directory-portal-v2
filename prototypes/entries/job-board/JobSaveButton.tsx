'use client';

import clsx from 'clsx';

// The row's own icon-trigger chrome — the share glyph's 8px disc with the hover
// wash — so Save sits beside Share as the same kind of thing.
import rs from '@/components/page/jobs/TeamGroupCard/component/ReferRoleRow/components/ReferMenu/ReferMenu.module.scss';

import { BookmarkGlyph } from '../save-shared/BookmarkIcon';
import s from './JobSaveButton.module.scss';

interface Props {
  saved: boolean;
  onToggle: () => void;
  /** The role, for the accessible name — the glyph carries no text. */
  roleTitle: string;
}

/**
 * Save, on a role row: a bookmark beside the share icon.
 *
 * **Why an icon and not a "Save" button.** Wellfound and Upwork spell it out
 * as a bordered button; Glassdoor, Braintrust, Remote and Peerlist draw the
 * bookmark. This row already ranks its presses — Apply is the filled primary,
 * Refer the quiet text button, Share the icon — and Save is the same order of
 * press as Share: a sideline you take instead of applying, not a second call
 * to action. A labelled button here would be a fourth thing to price against
 * Apply on every row of a board; a glyph in the share icon's own chrome costs
 * the row nothing. The bookmark is the one mark every job board on Mobbin
 * agrees on for this.
 *
 * **Saved is the filled glyph in brand blue** — the trigger's own open-state
 * colour (`.trigger[aria-expanded]`), so the row keeps one active tone. Grey
 * outline at rest, like Share; `aria-pressed` carries the state.
 *
 * Wears `rs.trigger` on a real `<button>` rather than the span production
 * uses: the UA's border, background and font have to come off (see the
 * stylesheet), and the row's own click guard already ignores buttons, so a
 * press here never opens the job under it.
 */
export function JobSaveButton({ saved, onToggle, roleTitle }: Props) {
  return (
    <button
      type="button"
      className={clsx(rs.trigger, s.saveTrigger, saved && s.saved)}
      aria-pressed={saved}
      aria-label={saved ? `Unsave ${roleTitle}` : `Save ${roleTitle}`}
      title={saved ? 'Saved' : 'Save'}
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
    >
      <BookmarkGlyph filled={saved} size={18} />
    </button>
  );
}
