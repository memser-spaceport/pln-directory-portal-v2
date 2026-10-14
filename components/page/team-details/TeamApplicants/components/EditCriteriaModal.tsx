'use client';

import { useState } from 'react';
import clsx from 'clsx';

import { Button } from '@/components/common/Button';
import { Checkbox } from '@/components/common/Checkbox';
import { Modal } from '@/components/common/Modal';
import { CloseIcon } from '@/components/icons';
import { CRITERIA_PROMPT_MAX_LENGTH, type RoleCriterion } from '@/schema/suggested-candidates';

import s from './EditCriteriaModal.module.scss';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  roleTitle: string;
  /** The role's criteria as the server last answered them. */
  criteria: RoleCriterion[];
  /** The lead's saved prompt (LAB-2853), or null when none is saved. */
  prompt: string | null;
  isSaving: boolean;
  /**
   * The texts to switch off, and the prompt: trimmed, `null` when the box is
   * empty. The host saves, closes on success, and toasts on failure.
   */
  onSave: (disabled: string[], prompt: string | null) => void;
}

const disabledOf = (criteria: RoleCriterion[]) => new Set(criteria.filter((c) => !c.enabled).map((c) => c.text));

/**
 * Edit criteria (LAB-2847): which of the role's requirements count when the
 * product matches people to it.
 *
 * It switches the posting's own requirements on or off, and never adds new
 * ones. **The last one on cannot be switched off**: with none, nobody could
 * match, so the box is inert rather than Save failing on another line.
 *
 * Under the switches, one free-text box (LAB-2853): who the lead is looking
 * for, in their own words, up to 500 characters. The switches can only turn
 * the posting's requirements off. The box is where a lead says what the
 * posting does not, and the matcher reads it with the requirements. It is
 * saved with the switches, and an emptied box clears the saved prompt.
 *
 * Texts are the keys: the contract sends no ids, and the save names the
 * switched-off ones by text. The draft is reset from the saved list every time
 * the modal opens, so Cancel discards; a failed save leaves the modal open on
 * the draft, because the host keeps `isOpen` true.
 */
export function EditCriteriaModal({ isOpen, onClose, roleTitle, criteria, prompt, isSaving, onSave }: Props) {
  const [draft, setDraft] = useState<Set<string>>(() => disabledOf(criteria));
  const [promptDraft, setPromptDraft] = useState(prompt ?? '');
  const [wasOpen, setWasOpen] = useState(isOpen);
  if (wasOpen !== isOpen) {
    /* Adjusted during render, as `Modal` does, so the opening render already
       shows the saved switches and prompt rather than last time's draft. */
    setWasOpen(isOpen);
    if (isOpen) {
      setDraft(disabledOf(criteria));
      setPromptDraft(prompt ?? '');
    }
  }

  const saved = disabledOf(criteria);
  const onCount = criteria.filter((c) => !draft.has(c.text)).length;
  const promptText = promptDraft.trim();
  const promptTooLong = promptText.length > CRITERIA_PROMPT_MAX_LENGTH;
  const changed = criteria.some((c) => draft.has(c.text) !== saved.has(c.text)) || promptText !== (prompt ?? '').trim();

  const toggle = (text: string) =>
    setDraft((prev) => {
      const next = new Set(prev);
      if (next.has(text)) next.delete(text);
      else next.add(text);
      return next;
    });

  const save = () =>
    onSave(
      criteria.filter((c) => draft.has(c.text)).map((c) => c.text),
      promptText || null,
    );

  return (
    <Modal isOpen={isOpen} onClose={onClose} ariaLabelledBy="edit-criteria-title" lockScroll inertBackground>
      <div className={s.root}>
        <div className={s.header}>
          <div className={s.headerText}>
            <h2 id="edit-criteria-title" className={s.title}>
              Edit criteria
            </h2>
            <p className={s.subtitle}>
              Choose which requirements of {roleTitle || 'this role'} count when we match people. Changes apply from
              next week’s suggestions.
            </p>
          </div>
          <button type="button" className={s.closeButton} onClick={onClose} aria-label="Close">
            <CloseIcon width={20} height={20} color="#0a0c11" />
          </button>
        </div>

        <div className={s.content}>
          <ul className={s.list} aria-label="Requirements">
            {criteria.map((criterion, index) => {
              const on = !draft.has(criterion.text);
              const locked = on && onCount === 1;
              return (
                <li key={`${index}-${criterion.text}`}>
                  <label className={clsx(s.row, locked && s.rowLocked)}>
                    <Checkbox checked={on} disabled={locked || isSaving} onChange={() => toggle(criterion.text)} />
                    <span className={s.rowText}>
                      {criterion.text}
                      {locked && <span className={s.hint}>At least one requirement stays on.</span>}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>

          <div className={s.prompt}>
            <label className={s.promptLabel} htmlFor="edit-criteria-prompt">
              Tell us who you’re looking for
            </label>
            <textarea
              id="edit-criteria-prompt"
              className={s.promptField}
              rows={4}
              maxLength={CRITERIA_PROMPT_MAX_LENGTH}
              value={promptDraft}
              disabled={isSaving}
              onChange={(e) => setPromptDraft(e.target.value)}
              placeholder="e.g. Has run a storage or networking service in production. Open to people coming from research."
              aria-describedby="edit-criteria-prompt-count"
              aria-invalid={promptTooLong || undefined}
            />
            <p id="edit-criteria-prompt-count" className={promptTooLong ? s.countOver : s.count}>
              {promptDraft.length} / {CRITERIA_PROMPT_MAX_LENGTH}
            </p>
          </div>
        </div>

        <div className={s.footer}>
          <Button style="border" variant="neutral" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={!changed || promptTooLong || isSaving} onClick={save}>
            {isSaving ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
