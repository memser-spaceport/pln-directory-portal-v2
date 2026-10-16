'use client';

import { useId, useState } from 'react';
import clsx from 'clsx';

import { Button } from '@/components/common/Button';
import { Checkbox } from '@/components/common/Checkbox';
import { Modal } from '@/components/common/Modal';
import { CloseIcon } from '@/components/icons';
import { CRITERIA_PROMPT_MAX_LENGTH, type RoleCriterion } from '@/schema/suggested-candidates';

import { criterionLines, groupCriteria } from './criteriaGroups';
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
 * saved with the switches, and an emptied box clears the saved prompt. Its
 * label names the role and a helper text under it says the AI reads the box
 * (LAB-2869, Polina's copy), so the lead knows the words change the matches.
 *
 * **Grouped, with short labels (LAB-2854, after Polina's prototype).** The
 * requirements sit under Skills, Experience, Seniority, Location and Other,
 * each row its short label over the full statement in grey: this is where the
 * lead decides what counts, so it is the one place the whole sentence is
 * spelled out. A backend that sends no groups gets one flat list, and a
 * requirement with no label shows its statement alone, as before.
 *
 * Texts (the statements) are the keys: the contract sends no ids, and the
 * save names the switched-off ones by text. The draft is reset from the saved list every time
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

  const headingId = useId();
  const sections = groupCriteria(criteria);
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
              Edit AI criteria
            </h2>
            <p className={s.subtitle}>What the AI matches members against for {roleTitle || 'this role'}.</p>
          </div>
          <button type="button" className={s.closeButton} onClick={onClose} aria-label="Close">
            <CloseIcon width={20} height={20} color="#0a0c11" />
          </button>
        </div>

        <div className={s.content}>
          {sections.map(({ group, items }) => (
            <div key={group ?? 'all'} className={s.group}>
              {group && (
                <p id={`${headingId}-${group}`} className={s.groupLabel}>
                  {group}
                </p>
              )}
              <ul
                className={s.list}
                aria-label={group ? undefined : 'Requirements'}
                aria-labelledby={group ? `${headingId}-${group}` : undefined}
              >
                {items.map(({ criterion, index }) => {
                  const on = !draft.has(criterion.text);
                  const locked = on && onCount === 1;
                  const { primary, statement } = criterionLines(criterion);
                  return (
                    <li key={`${index}-${criterion.text}`}>
                      <label className={clsx(s.row, locked && s.rowLocked)}>
                        <Checkbox checked={on} disabled={locked || isSaving} onChange={() => toggle(criterion.text)} />
                        <span className={s.rowText}>
                          {primary}
                          {statement && <span className={s.statement}>{statement}</span>}
                          {locked && <span className={s.hint}>At least one requirement stays on.</span>}
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}

          <div className={s.prompt}>
            <label className={s.promptLabel} htmlFor="edit-criteria-prompt">
              Help us suggest better members for {roleTitle || 'this role'}.
            </label>
            <p id="edit-criteria-prompt-help" className={s.promptHelp}>
              Tell the AI who you’re looking for
            </p>
            <textarea
              id="edit-criteria-prompt"
              className={s.promptField}
              rows={4}
              maxLength={CRITERIA_PROMPT_MAX_LENGTH}
              value={promptDraft}
              disabled={isSaving}
              onChange={(e) => setPromptDraft(e.target.value)}
              placeholder="e.g. Has run a storage or networking service in production. Open to people coming from research."
              aria-describedby="edit-criteria-prompt-help edit-criteria-prompt-count"
              aria-invalid={promptTooLong || undefined}
            />
            <p id="edit-criteria-prompt-count" className={promptTooLong ? s.countOver : s.count}>
              {promptDraft.length} / {CRITERIA_PROMPT_MAX_LENGTH}
            </p>
          </div>
        </div>

        <div className={s.footer}>
          <p className={s.footerNote}>Changes apply from next week’s suggestions.</p>
          <div className={s.footerActions}>
            <Button style="border" variant="neutral" onClick={onClose}>
              Cancel
            </Button>
            <Button disabled={!changed || promptTooLong || isSaving} onClick={save}>
              {isSaving ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
