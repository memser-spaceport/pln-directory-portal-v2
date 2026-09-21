'use client';

import { clsx } from 'clsx';
import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/common/Button/Button';
import { CloseIcon, CommentIcon, DocumentIcon, PencilSimpleLineIcon } from '@/components/icons';
// The feedback dialog's card (radius, shadow) — the same borrowing PinThread
// makes, so the popover and a thread read as one family.
import fd from '@/components/page/ai-apps/components/GiveAiAppFeedbackDialog/GiveAiAppFeedbackDialog.module.scss';
// The capture's shimmer, shared with the thread.
import pt from './PinThread.module.scss';

import type { CommentAnchor } from './types';
import { ShotEditor } from './ShotEditor';
import s from './DraftsPanel.module.scss';

const MAX_LENGTH = 5000;

/** A pinned comment that has been written and not sent. */
export interface DraftItem {
  id: string;
  anchor: CommentAnchor;
  /** Data URL of the element that was picked, possibly marked up. Null: none. */
  shot: string | null;
  /** The capture is on its way; the chip already has its place so nothing jumps. */
  shotPending: boolean;
  text: string;
}

interface Props {
  /** The words ("in the app" / "on the page"), and whether a floating button sits under the dock. */
  isPage: boolean;
  /** What is being commented on: the app's name, or the page. */
  subject: string;
  drafts: DraftItem[];
  /** The plain comment: about the whole app or page, no pin. */
  general: string;
  /** Ask a card to scroll into view (the press on its pin). `n` makes repeats count. */
  focus: { id: string; n: number } | null;
  onGeneral: (text: string) => void;
  onChange: (id: string, patch: Partial<Pick<DraftItem, 'shot'>>) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
  /** Just sent this many: said once, in the hint's place, then the hint comes back. */
  sentCount: number;
  /** Leaves comment mode. What is queued stays for when the mode comes back. */
  onClose: () => void;
  onSend: () => void;
  /** The pointer moved onto the popover: the page under it is not being pointed at. */
  onPointerEnter: () => void;
}

/* 16px stroked glyphs in currentColor, the weight of the DS icons beside them. */
const glyph = { width: 16, height: 16, viewBox: '0 0 16 16', fill: 'none', 'aria-hidden': true } as const;
const stroke = { stroke: 'currentColor', strokeWidth: 1.3, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

const TrashGlyph = () => (
  <svg {...glyph}>
    <path d="M2.5 4h11M6 4V2.5h4V4M4 4l.6 9a1 1 0 0 0 1 .9h4.8a1 1 0 0 0 1-.9L12 4M6.5 7v4M9.5 7v4" {...stroke} />
  </svg>
);

const TargetGlyph = () => (
  <svg {...glyph}>
    <circle cx="8" cy="8" r="5.5" {...stroke} />
    <circle cx="8" cy="8" r="2" {...stroke} />
    <path d="M8 8l5-5" {...stroke} />
  </svg>
);

const SendGlyph = () => (
  <svg {...glyph}>
    <path d="M14 2 7.2 8.8M14 2 9.5 14l-2.3-5.2L2 6.5 14 2Z" {...stroke} />
  </svg>
);

const ImageGlyph = () => (
  <svg {...glyph} width={14} height={14}>
    <rect x="2" y="3" width="12" height="10" rx="1.5" {...stroke} />
    <circle cx="5.8" cy="6.5" r="1" {...stroke} />
    <path d="m2.5 11.5 3.2-3 2.5 2.2 2-1.7 3.3 3" {...stroke} />
  </svg>
);

function Card(props: {
  draft: DraftItem;
  n: number;
  focus: Props['focus'];
  onRemove: Props['onRemove'];
  onOpenShot: () => void;
}) {
  const { draft, n, focus, onRemove, onOpenShot } = props;
  const ref = useRef<HTMLLIElement>(null);

  useEffect(() => {
    if (focus?.id === draft.id) ref.current?.scrollIntoView({ block: 'nearest' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focus?.n]);

  return (
    <li ref={ref} className={s.comment}>
      <span className={s.number} aria-hidden>
        {n}
      </span>
      <div className={s.commentBody}>
        <div className={s.commentHead}>
          <span className={s.commentLabel}>Comment</span>
          {/* Where the reference quotes the selected text, this quotes the picked
              element: its screenshot, which opens full size with the marking tools. */}
          {draft.shot ? (
            <button
              type="button"
              className={s.shotChip}
              onClick={onOpenShot}
              aria-label={`Open screenshot ${n}`}
              title="View and draw on the screenshot"
            >
              <img src={draft.shot} alt="" />
              Screenshot
              {/* The pencil is what says the picture can be drawn on; without it the
                  chip read as a label, and the editor behind it went unfound. */}
              <PencilSimpleLineIcon width={12} height={12} aria-hidden />
            </button>
          ) : (
            draft.shotPending && (
              <span className={s.shotChip} aria-hidden>
                <span className={clsx(s.shotChipPending, pt.shotPending)} />
                Screenshot
              </span>
            )
          )}
        </div>
        <p className={s.commentText}>{draft.text}</p>
      </div>
      <button
        type="button"
        className={s.remove}
        onClick={() => onRemove(draft.id)}
        aria-label={`Remove comment ${n}`}
        title="Remove comment"
      >
        <CloseIcon width={16} height={16} />
      </button>
    </li>
  );
}

/**
 * Everything you are about to send, docked in the window's bottom-right corner for as
 * long as comment mode is on. It replaced the black hint toolbar: the hint, the
 * queue, the plain-comment field and the way out (Close leaves the mode) are one
 * object, so there is no second thing to open.
 * A transcription of Cofounder's review popover (chips + Clear, numbered comment
 * cards with an accent edge, a grey "whole document" box with its field, Close
 * and Send), in the PL token pairs. The one deliberate difference: a card's
 * quote chip is a **Screenshot** chip, because what was picked here is an
 * element, not a run of text; it opens `ShotEditor` to look at and mark up.
 *
 * Notes are written at the pin (`PinComposer`); here they are read over, removed,
 * and sent with the plain comment as one set.
 */
export function DraftsPanel(props: Props) {
  const { isPage, subject, drafts, general, focus, sentCount, onGeneral, onChange, onRemove, onClear, onClose, onSend } =
    props;
  const [editingId, setEditingId] = useState<string | null>(null);
  const editing = drafts.find((d) => d.id === editingId) ?? null;

  const canSend = drafts.length > 0 || general.trim().length > 0;

  return (
    <section
      className={clsx(fd.root, s.panel, isPage && s.panelPage)}
      aria-label="Your feedback"
      onClick={(e) => e.stopPropagation()}
      onMouseMove={(e) => e.stopPropagation()}
      onMouseEnter={props.onPointerEnter}
    >
      <div className={s.top}>
        <div className={s.chips}>
          {drafts.length > 0 && (
            <span className={clsx(s.chip, s.chipCount)}>
              <CommentIcon />
              {drafts.length} {drafts.length === 1 ? 'comment' : 'comments'}
            </span>
          )}
          <span className={s.chip}>
            <DocumentIcon width={16} height={16} aria-hidden />
            <span className={s.chipText}>{subject}</span>
          </span>
        </div>
        {drafts.length > 0 && (
          <button type="button" className={s.clear} onClick={onClear}>
            <TrashGlyph />
            Clear
          </button>
        )}
      </div>

      <div className={s.scroll}>
        {/* With nothing queued the docked panel is also the mode's hint — what the
            black toolbar used to say — and, right after a send, its receipt. */}
        {drafts.length === 0 && (
          <p className={s.hint} aria-live="polite">
            {sentCount > 0 ? (
              `Sent ${sentCount} ${sentCount === 1 ? 'comment' : 'comments'}.`
            ) : (
              <>
                Click anything {isPage ? 'on the page' : 'in the app'} to pin a comment with a screenshot, or write one
                below.
              </>
            )}
          </p>
        )}

        {drafts.length > 0 && (
          <ul className={s.comments}>
            {drafts.map((d, i) => (
              <Card
                key={d.id}
                draft={d}
                n={i + 1}
                focus={focus}
                onRemove={onRemove}
                onOpenShot={() => setEditingId(d.id)}
              />
            ))}
          </ul>
        )}

        <div className={s.whole}>
          <div className={s.wholeHead}>
            <span className={s.wholeLabel}>
              <TargetGlyph />
              {isPage ? 'Whole page' : 'Whole app'}
            </span>
          </div>
          <textarea
            className={s.field}
            rows={3}
            maxLength={MAX_LENGTH}
            aria-label="Comment"
            placeholder={isPage ? 'Leave a comment for the LabOS team…' : 'Leave a comment for the app’s author…'}
            value={general}
            onChange={(e) => onGeneral(e.target.value)}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && canSend) onSend();
            }}
          />
        </div>
      </div>

      <div className={s.footer}>
        <Button style="link" variant="neutral" size="s" onClick={onClose}>
          Close
        </Button>
        <Button size="s" className={s.send} disabled={!canSend} onClick={onSend}>
          <SendGlyph />
          Send
        </Button>
      </div>

      {editing?.shot && (
        <ShotEditor
          src={editing.shot}
          mode="edit"
          onClose={() => setEditingId(null)}
          onDone={(edited) => {
            onChange(editing.id, { shot: edited });
            setEditingId(null);
          }}
        />
      )}
    </section>
  );
}
