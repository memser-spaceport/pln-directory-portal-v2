'use client';

import { useEffect, useState } from 'react';
import clsx from 'clsx';

import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { Checkbox } from '@/components/common/Checkbox';
import { CloseIcon } from '@/components/icons';

// The product's standard modal shell: the deals dialog's header / close disc /
// content / footer, and the gantry idea modal's card. Same pair the Post news
// modal wears.
import dealModalStyles from '@/components/page/deals/SubmitDealModal/SubmitDealModal.module.scss';
import ideaModalStyles from '@/components/page/gantry/ideas/SubmitIdeaModal/SubmitIdeaModal.module.scss';

import { CRITERION_GROUPS, MATCH_FLOOR, visibleSuggested, type RoleCriterion, type RoleSuggested } from './mocks';
import s from './SuggestedMatch.module.scss';

interface Props {
  open: boolean;
  onClose: () => void;
  roleTitle: string;
  criteria: RoleCriterion[];
  /** Everyone matched to the role, below the floor or not — the footer counts who would show. */
  people: RoleSuggested[];
  /** Criteria currently switched off. */
  off: ReadonlySet<string>;
  onSave: (off: Set<string>) => void;
}

/**
 * Edit criteria — what a match is measured against for one role.
 *
 * Workable's "Manage matching criteria" (a checkbox per criterion, grouped
 * Education / Experience / Skills, with Save and Discard) is the reference, and
 * it is the part that makes a percentage defensible: the team, not the
 * product, decides what a fit is. Criteria arrive from the posting (skills it
 * names, its seniority, its hours); this only switches them off or on. It does
 * not add new ones — a free-text criterion is a matching engine, and the
 * postings already say what the role asks for.
 *
 * **The footer says what the change does.** "3 members at 60% or above" moves
 * as boxes are ticked, so turning off "Senior or above" visibly brings someone
 * in, and it is also the one place the floor is stated — the interface has
 * nowhere else to tell a lead why a member they expected is not listed. **The
 * last criterion cannot be switched off**: with none, every percentage is 0,
 * so the box is inert rather than the Save dead for a reason on another line.
 */
export function CriteriaModal({ open, onClose, roleTitle, criteria, people, off, onSave }: Props) {
  const [draft, setDraft] = useState<Set<string>>(() => new Set(off));

  // A fresh draft each time it opens, so Cancel really discards.
  useEffect(() => {
    if (open) setDraft(new Set(off));
  }, [open, off]);

  const toggle = (id: string) =>
    setDraft((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const onCount = criteria.filter((c) => !draft.has(c.id)).length;
  const changed = criteria.some((c) => draft.has(c.id) !== off.has(c.id));
  const shown = visibleSuggested(people, criteria, draft).length;

  return (
    <Modal isOpen={open} onClose={onClose}>
      <div className={ideaModalStyles.root}>
        <div className={dealModalStyles.header}>
          <div className={dealModalStyles.headerText}>
            <h2 className={dealModalStyles.title}>Edit criteria</h2>
            <p className={dealModalStyles.subtitle}>What counts as a fit for {roleTitle}.</p>
          </div>
          <button type="button" className={dealModalStyles.closeButton} onClick={onClose} aria-label="Close">
            <CloseIcon width={20} height={20} color="#0a0c11" />
          </button>
        </div>

        <div className={dealModalStyles.content}>
          <div className={s.editGroups}>
            {CRITERION_GROUPS.map((group) => {
              const items = criteria.filter((c) => c.group === group);
              if (!items.length) return null;
              return (
                <div key={group} className={s.editGroup}>
                  <p className={s.editGroupLabel}>{group}</p>
                  {items.map((c) => {
                    const on = !draft.has(c.id);
                    const locked = on && onCount === 1;
                    return (
                      <label key={c.id} className={clsx(s.editRow, { [s.editRowLocked]: locked })}>
                        <Checkbox checked={on} disabled={locked} onChange={() => toggle(c.id)} />
                        {c.label}
                      </label>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>

        <div className={dealModalStyles.footer}>
          <span className={s.footerNote}>
            {shown} {shown === 1 ? 'member' : 'members'} at {MATCH_FLOOR}% or above
          </span>
          <div className={s.footerActions}>
            <Button style="border" variant="neutral" onClick={onClose}>
              Cancel
            </Button>
            <Button
              disabled={!changed}
              onClick={() => {
                onSave(draft);
                onClose();
              }}
            >
              Save
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
