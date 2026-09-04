'use client';

import { useRef } from 'react';

import { HeaderActionBtn } from '@/components/common/profile/DetailsSection/components/DetailsSectionHeader/components/HeaderActionBtn';

import s from './CvHeaderActions.module.scss';

interface CvHeaderActionsProps {
  /** A file was chosen — validated downstream by the same dropzone a drop uses. */
  onReplace: (file: File) => void;
  /** Opens the confirmation; the removal itself is the host's — see `RemoveCvDialog`. */
  onRemove: () => void;
}

/**
 * The kept CV's two section actions, in the slot every section keeps for them.
 *
 * **The Experience header's pair, with the words changed.** That header carries
 * a quiet grey "Update from CV" beside a brand-blue "+ Add": one loud control
 * for what the section is for, one quiet one for the shortcut. Here the section
 * is for holding a document, so the loud one is **Replace** — the maintenance
 * action a person with a CV actually comes back for — and the quiet one is
 * **Remove**. Same order (quiet first, loud at the edge), same components: the
 * blue is production's `HeaderActionBtn`, the grey is the exact values the
 * drawer's `.headerImport` and the onboarding page's `.headerAction` already
 * use, so this pair and Experience's read as one grammar.
 *
 * **Replace opens the file dialog on the press.** A control that says Replace
 * and lands on a drop area asking you to choose a file is the press not being
 * taken at its word (lesson 1, fourth example). The input sits beside the
 * button so the click itself carries the user gesture — Safari refuses a picker
 * opened from an effect.
 *
 * **Not on the file row.** `FileUploader` puts a ✕ on its file row, and that is
 * right there: the row is a draft, the ✕ un-chooses. A kept CV is a record, and
 * un-choosing it is a removal with a consequence for people who are not in the
 * room (teams you've applied to). A ✕ promises instant dismissal; a text control
 * that opens a confirmation promises what actually happens.
 */
export function CvHeaderActions({ onReplace, onRemove }: CvHeaderActionsProps) {
  const input = useRef<HTMLInputElement>(null);

  return (
    <div className={s.actions}>
      <button type="button" className={s.quiet} onClick={onRemove}>
        Remove
      </button>
      <HeaderActionBtn onClick={() => input.current?.click()}>Replace</HeaderActionBtn>
      <input
        ref={input}
        type="file"
        className={s.visuallyHidden}
        accept=".pdf,.doc,.docx"
        onChange={(ev) => {
          const chosen = ev.target.files?.[0] ?? null;
          /* Cleared so picking the same file twice still fires a change event —
             "try again with the same document" is a real path after a failed read. */
          ev.target.value = '';
          if (chosen) onReplace(chosen);
        }}
      />
    </div>
  );
}
