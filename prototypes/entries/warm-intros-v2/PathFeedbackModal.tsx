'use client';

/**
 * Feedback modal for one warm path — the "broader description" escape hatch
 * behind the card's `Give feedback` link.
 *
 * One field: a free-text box. No reason chips — nothing gets pre-categorised, so
 * whatever's wrong can be said in the reporter's own words.
 *
 * The one thing it does add is a read-only restatement of the path at the top, so
 * nobody has to describe which of an investor's paths they mean.
 *
 * Chrome is the shared content-modal pattern (SubmitDealModal styles + Modal's
 * own dialog / scroll-lock / inert props) — the same one MasterProfileModalMock
 * and the Gantry item modal use.
 *
 * Dismissal is deliberate only: the close icon or Cancel. A stray backdrop click
 * would throw away everything typed, and the modal has no draft to fall back on.
 * Escape stays wired — it's the keyboard equivalent of the close icon, and a
 * dialog you can't leave from the keyboard is a trap. Modal binds it in the
 * capture phase with stopImmediatePropagation, so Esc closes this and leaves the
 * drawer underneath open.
 */

import { useState } from 'react';
import Image from 'next/image';
import clsx from 'clsx';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button/Button';
import { CloseIcon } from '@/components/icons';
import { ProximityCodeBadge } from '@/components/page/investors/ProximityCodeBadge/ProximityCodeBadge';
import { ScorePercentPill } from '@/components/page/investors/WarmIntrosV2Workspace/ScorePercentPill';
import type { ScoreBand } from '@/services/investors/warm-intros-v2.types';
// Shared content-modal chrome — the same module the Gantry item modal imports.
import m from '@/components/page/deals/SubmitDealModal/SubmitDealModal.module.scss';
// Hop-chain layout and person-chip visuals, straight from the drawer that opened
// this modal — so the path reads identically in both places.
import d from '@/components/page/investors/WarmIntrosV2Workspace/WarmIntrosV2InvestorDrawer.module.scss';
import chip from '@/components/page/investors/WarmIntrosV2Workspace/PathProfileChip.module.scss';
// Textarea visuals reused from FormTextArea; the component itself needs a
// react-hook-form context this prototype has no reason to stand up.
import t from '@/components/form/FormTextArea/FormTextArea.module.scss';
import f from './PathFeedback.module.scss';

export type PathFeedbackSubmission = {
  note: string;
};

const NOTE_MAX = 600;

export type PathNode = {
  profileUid: string;
  name: string;
  imageUrl?: string | null;
};

export interface PathContext {
  /** The hop chain, in order — same nodes the drawer's card renders. */
  nodes: PathNode[];
  /** Who'd make the intro, for the card's "Can you refer via …?" label. */
  connectorName: string | null;
  proximityCode?: string | null;
  scorePercent?: number | null;
  scoreBand?: ScoreBand;
}

/** Mirrors the private helper inside PathProfileChip. */
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
  onSubmit: (value: PathFeedbackSubmission) => void;
  context: PathContext;
  /** Existing report, when someone re-opens the modal to amend it. */
  initial?: PathFeedbackSubmission;
}

export function PathFeedbackModal({ open, onClose, onSubmit, context, initial }: Props) {
  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      closeOnEscape
      closeOnBackdropClick={false}
      ariaLabelledBy="wi2-path-feedback-title"
      lockScroll
      inertBackground
    >
      {/* The form is its own component so Modal mounting it is what seeds the
          fields — re-opening shows what was already sent without an effect that
          writes state on every open. */}
      <FeedbackForm onClose={onClose} onSubmit={onSubmit} context={context} initial={initial} />
    </Modal>
  );
}

function FeedbackForm({ onClose, onSubmit, context, initial }: Omit<Props, 'open'>) {
  const [note, setNote] = useState(initial?.note ?? '');

  // The box is the whole form, so an empty one is an empty report.
  const canSubmit = note.trim().length > 0;

  const submit = () => {
    if (!canSubmit) return;
    onSubmit({ note: note.trim() });
  };

  return (
    <div className={m.root}>
      <div className={m.header}>
        <div className={m.headerText}>
          <h2 id="wi2-path-feedback-title" className={m.title}>
            Give feedback
          </h2>
          <p className={m.subtitle}>Tell us what&rsquo;s wrong with this path so we can correct the graph.</p>
        </div>
        <button type="button" className={m.closeButton} onClick={onClose} aria-label="Close">
          <CloseIcon width={20} height={20} color="#0a0c11" />
        </button>
      </div>

      <div className={m.content}>
        <div className={m.form}>
          {/* Which path this is about — stated, not typed. */}
          <div className={f.context}>
            <div className={f.contextMeta}>
              {context.proximityCode ? <ProximityCodeBadge code={context.proximityCode} /> : null}
              {context.scorePercent != null ? (
                <ScorePercentPill scorePercent={context.scorePercent} scoreBand={context.scoreBand} />
              ) : null}
            </div>
            {/* The same avatar chips the card shows, rendered as spans — inside
                the modal the chain is a restatement, not a way to navigate off
                to a profile mid-report. */}
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
              <label className={t.label} htmlFor="wi2-path-feedback-note">
                How can we improve this path?
              </label>
            </div>
            <div className={t.input}>
              <div className={t.inputContent}>
                <textarea
                  id="wi2-path-feedback-note"
                  className={t.inputElement}
                  rows={7}
                  maxLength={NOTE_MAX}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  autoFocus
                  placeholder="A better connector, a caliber that's off, details that need updating, a path that isn't real — whatever would make this more useful, in your own words."
                />
              </div>
            </div>
            <div className={t.descriptionRow}>
              <span className={m.helperText}>The more specific, the more we can act on.</span>
              <span className={t.counter}>
                {note.length} / {NOTE_MAX}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className={m.footer}>
        <p className={m.footerNote}>Goes to the Investor DB team.</p>
        <div className={m.footerActions}>
          <Button style="border" variant="secondary" size="s" onClick={onClose}>
            Cancel
          </Button>
          <Button style="fill" variant="primary" size="s" onClick={submit} disabled={!canSubmit}>
            Send feedback
          </Button>
        </div>
      </div>
    </div>
  );
}
