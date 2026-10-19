'use client';

import { useEffect, useState } from 'react';

import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { CloseIcon } from '@/components/icons';
import { AiSearchIcon } from '@/prototypes/components/AiSearchIcon/AiSearchIcon';

// The product's standard modal shell, as Edit criteria wears it.
import dealModalStyles from '@/components/page/deals/SubmitDealModal/SubmitDealModal.module.scss';
import ideaModalStyles from '@/components/page/gantry/ideas/SubmitIdeaModal/SubmitIdeaModal.module.scss';

import s from './SuggestedMatch.module.scss';

/** Dev's limit on the field (staging, 2026-10-15). */
const MAX = 500;

interface Props {
  open: boolean;
  onClose: () => void;
  roleTitle: string;
  prompt: string;
  onSave: (prompt: string) => void;
}

/**
 * Brief the AI: the lead's own words about who they're looking for, sent to
 * the matcher with the role's requirements.
 *
 * **Its own option, not a field under Edit criteria (2026-10-15).** Under the
 * checklist it read as one more criterion, written out — nothing said a model
 * reads it. Criteria are the posting's requirements, switched on or off, and
 * they move the counts live; this is free text an AI interprets, and it moves
 * nothing until the next suggestions. Two different kinds of change, so two
 * doors: Edit criteria stays on the person's "Why we suggested" header, and
 * this one sits under the suggested tab's note, beside the list it re-ranks.
 *
 * Saying it is AI is the AI Search mark in the title and the word in the
 * label; the line under the field says where the words go and who never sees
 * them, which is the question a lead asks before typing about people.
 */
export function AiBriefModal({ open, onClose, roleTitle, prompt, onSave }: Props) {
  const [draft, setDraft] = useState(prompt);

  // A fresh draft each time it opens, so Cancel really discards.
  useEffect(() => {
    if (open) setDraft(prompt);
  }, [open, prompt]);

  const changed = draft.trim() !== prompt.trim();

  return (
    <Modal isOpen={open} onClose={onClose}>
      <div className={ideaModalStyles.root}>
        <div className={dealModalStyles.header}>
          <div className={dealModalStyles.headerText}>
            <h2 className={`${dealModalStyles.title} ${s.briefTitle}`}>
              <AiSearchIcon size={20} />
              Brief the AI
            </h2>
            <p className={dealModalStyles.subtitle}>Help it suggest better members for {roleTitle}.</p>
          </div>
          <button type="button" className={dealModalStyles.closeButton} onClick={onClose} aria-label="Close">
            <CloseIcon width={20} height={20} color="#0a0c11" />
          </button>
        </div>

        <div className={dealModalStyles.content}>
          <label htmlFor="ai-brief" className={s.promptLabel}>
            Tell the AI who you’re looking for
          </label>
          <textarea
            id="ai-brief"
            className={s.promptField}
            rows={5}
            maxLength={MAX}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="e.g. Has run a storage or networking service in production. Open to people coming from research."
            aria-describedby="ai-brief-note"
          />
          <div className={s.briefMeta}>
            <span id="ai-brief-note">Read with the role’s criteria. Members never see it.</span>
            <span>
              {draft.length} / {MAX}
            </span>
          </div>
        </div>

        <div className={dealModalStyles.footer}>
          <span className={s.footerNote}>Changes apply from next week’s suggestions.</span>
          <div className={s.footerActions}>
            <Button style="border" variant="neutral" onClick={onClose}>
              Cancel
            </Button>
            <Button
              disabled={!changed}
              onClick={() => {
                onSave(draft.trim());
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
