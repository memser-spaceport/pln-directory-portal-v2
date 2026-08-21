'use client';

/**
 * Path-note modal for one warm path — useful context (outreach status, next
 * step), not a report that the path is wrong. Chrome matches PathFeedbackModal.
 */

import { useState } from 'react';
import Image from 'next/image';
import clsx from 'clsx';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button/Button';
import { CloseIcon } from '@/components/icons';
import { ProximityCodeBadge } from '@/components/page/investors/ProximityCodeBadge/ProximityCodeBadge';
import { ScorePercentPill } from '@/components/page/investors/WarmIntrosV2Workspace/ScorePercentPill';
import type { PathContext } from './PathFeedbackModal';
import m from '@/components/page/deals/SubmitDealModal/SubmitDealModal.module.scss';
import d from '@/components/page/investors/WarmIntrosV2Workspace/WarmIntrosV2InvestorDrawer.module.scss';
import chip from '@/components/page/investors/WarmIntrosV2Workspace/PathProfileChip.module.scss';
import t from '@/components/form/FormTextArea/FormTextArea.module.scss';
import f from './PathFeedback.module.scss';

export type PathNoteSubmission = {
  note: string;
};

const NOTE_MAX = 600;

function initialsFromName(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (value: PathNoteSubmission) => void;
  onClear?: () => void;
  context: PathContext;
  initial?: PathNoteSubmission;
}

export function PathNoteModal({ open, onClose, onSubmit, onClear, context, initial }: Props) {
  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      closeOnEscape
      closeOnBackdropClick={false}
      ariaLabelledBy="wi2-path-note-title"
      lockScroll
      inertBackground
    >
      <NoteForm onClose={onClose} onSubmit={onSubmit} onClear={onClear} context={context} initial={initial} />
    </Modal>
  );
}

function NoteForm({ onClose, onSubmit, onClear, context, initial }: Omit<Props, 'open'>) {
  const [note, setNote] = useState(initial?.note ?? '');
  const editing = !!(initial?.note && initial.note.trim());
  const canSubmit = note.trim().length > 0;

  const submit = () => {
    if (!canSubmit) return;
    onSubmit({ note: note.trim() });
  };

  return (
    <div className={m.root}>
      <div className={m.header}>
        <div className={m.headerText}>
          <h2 id="wi2-path-note-title" className={m.title}>
            {editing ? 'Edit note' : 'Add a note'}
          </h2>
          <p className={m.subtitle}>
            Useful context on this path (outreach status, next step, etc.). This is not a report that the path is wrong.
          </p>
        </div>
        <button type="button" className={m.closeButton} onClick={onClose} aria-label="Close">
          <CloseIcon width={20} height={20} color="#0a0c11" />
        </button>
      </div>

      <div className={m.content}>
        <div className={m.form}>
          <div className={f.context}>
            <div className={f.contextMeta}>
              {context.proximityCode ? <ProximityCodeBadge code={context.proximityCode} /> : null}
              {context.scorePercent != null ? (
                <ScorePercentPill scorePercent={context.scorePercent} scoreBand={context.scoreBand} />
              ) : null}
            </div>
            <div className={d.chain}>
              {context.nodes.map((node, i) => (
                <span key={`${node.profileUid}-${i}`} className={d.node}>
                  {i > 0 && (
                    <span className={d.arrow} aria-hidden>
                      →
                    </span>
                  )}
                  <span className={clsx(chip.chip, f.chipStatic)}>
                    {node.imageUrl?.trim() ? (
                      <Image className={chip.avatarImg} src={node.imageUrl} alt="" width={20} height={20} unoptimized />
                    ) : (
                      <span className={chip.avatar} aria-hidden>
                        {initialsFromName(node.name) || '?'}
                      </span>
                    )}
                    <span className={chip.label}>{node.name}</span>
                  </span>
                </span>
              ))}
            </div>
          </div>

          <div className={m.fieldGroup}>
            <div className={t.labelWrapper}>
              <label className={t.label} htmlFor="wi2-path-note">
                Note
              </label>
            </div>
            <div className={t.input}>
              <div className={t.inputContent}>
                <textarea
                  id="wi2-path-note"
                  className={t.inputElement}
                  rows={7}
                  maxLength={NOTE_MAX}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  autoFocus
                  placeholder="e.g. Reached out last week. Waiting on a reply."
                />
              </div>
            </div>
            <div className={t.descriptionRow}>
              <span className={t.counter}>
                {note.length} / {NOTE_MAX}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className={m.footer}>
        {editing && onClear ? (
          <Button style="link" variant="secondary" size="s" underline onClick={onClear}>
            Clear note
          </Button>
        ) : (
          <p className={m.footerNote}>Visible to you. People with Investor DB edit can see everyone’s notes.</p>
        )}
        <div className={m.footerActions}>
          <Button style="border" variant="secondary" size="s" onClick={onClose}>
            Cancel
          </Button>
          <Button style="fill" variant="primary" size="s" onClick={submit} disabled={!canSubmit}>
            Save note
          </Button>
        </div>
      </div>
    </div>
  );
}
