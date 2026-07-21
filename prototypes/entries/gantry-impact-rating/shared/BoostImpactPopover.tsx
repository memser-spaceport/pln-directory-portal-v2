'use client';

// Prototype-local extension of production PinNotePopover (per prototypes/README "copy & simplify"):
// boosting IS rating — this popover commits the boost only once an impact rating is picked.
// Reuses the production popover chrome (module scss, read-only); the rating layout is local.

import { useLayoutEffect, useRef, useState } from 'react';
import { clsx } from 'clsx';
import { useIsNarrow } from '@/hooks/useIsNarrow';
import { Button } from '@/components/common/Button';
import { PushPinIcon } from '@/components/icons/PushPinIcon';
import { CloseIcon } from '@/components/icons/CloseIcon';
import p from '@/components/page/gantry/shared/PinNotePopover.module.scss';
import type { ImpactLevel } from '../mocks';
import { ImpactControl } from './ImpactControl';
import s from './BoostImpactPopover.module.scss';

const MAX_NOTE = 500;

export interface BoostRating {
  overall: ImpactLevel | null;
  perObjective: Record<string, ImpactLevel>;
  note: string;
}

interface Props {
  readonly pos: { top: number; left: number };
  /** Objectives to rate individually — pass only in the per-objective variant. */
  readonly objectives?: { uid: string; order: number; title: string }[];
  readonly onSave: (rating: BoostRating) => void;
  /** Dismissing without a rating cancels the boost (rating is mandatory). */
  readonly onCancel: () => void;
}

export function BoostImpactPopover({ pos, objectives, onSave, onCancel }: Props) {
  const [overall, setOverall] = useState<ImpactLevel | null>(null);
  const [perObjective, setPerObjective] = useState<Record<string, ImpactLevel>>({});
  const [note, setNote] = useState('');

  // On narrow screens the anchored popover becomes a bottom sheet (docked, full-width) — no
  // viewport math needed. On desktop, keep it fully on-screen: it grows taller once a rating is
  // picked (note + footer appear), so measure the real height and pull the top up whenever it
  // would spill past the viewport bottom. Runs before paint, so opening/growing never flickers.
  const isNarrow = useIsNarrow();
  const popoverRef = useRef<HTMLDivElement>(null);
  const [top, setTop] = useState(pos.top);
  useLayoutEffect(() => {
    if (isNarrow) return;
    const el = popoverRef.current;
    if (!el) return;
    const maxTop = window.innerHeight - el.offsetHeight - 12;
    setTop(Math.max(12, Math.min(pos.top, maxTop)));
  }, [pos.top, overall, objectives, isNarrow]);

  const canSave = overall !== null;
  const save = () => canSave && onSave({ overall, perObjective, note: note.trim() });

  return (
    <>
      <div className={p.backdrop} onClick={onCancel} />
      <div
        ref={popoverRef}
        className={clsx(p.popover, s.popover, isNarrow && s.mobileSheet)}
        style={isNarrow ? undefined : { top, left: pos.left }}
      >
        <div className={p.head}>
          <span className={p.pinIconWrap} aria-hidden>
            <PushPinIcon width={16} height={16} />
          </span>
          <div className={p.headText}>
            <h4 className={clsx(p.title, s.title)}>How much will this move our company goals?</h4>
          </div>
          <button type="button" className={p.closeBtn} onClick={onCancel} aria-label="Cancel boost">
            <CloseIcon width={14} height={14} />
          </button>
        </div>

        <div className={p.body}>
          <ImpactControl value={overall} onChange={setOverall} label="Impact to goals" />

          {objectives && objectives.length > 0 && (
            <div className={s.objectiveRows}>
              <span className={s.objectiveRowsLabel}>Break it down by goal (optional)</span>
              {objectives.map((obj) => (
                <div key={obj.uid} className={s.objectiveRow}>
                  <span className={s.objectiveLabel}>
                    <span className={s.objectiveBadge}>O{obj.order}</span>
                    <span className={s.objectiveTitle}>{obj.title}</span>
                  </span>
                  <ImpactControl
                    value={perObjective[obj.uid] ?? null}
                    onChange={(next) => setPerObjective((prev) => ({ ...prev, [obj.uid]: next }))}
                    label={`Impact on ${obj.title}`}
                  />
                </div>
              ))}
            </div>
          )}

          {/* The "why" note appears only after an impact level is picked. */}
          {overall && (
            <div className={s.noteBlock}>
              <textarea
                className={p.textarea}
                maxLength={MAX_NOTE}
                placeholder="Why this rating? (optional) e.g. blocking my work, needed for the August launch…"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                autoFocus
              />
              <div className={p.charCount}>
                {note.length} / {MAX_NOTE}
              </div>
            </div>
          )}
        </div>

        <div className={p.actions}>
          <Button style="border" variant="neutral" className={s.actionBtn} onClick={onCancel}>
            Cancel
          </Button>
          <Button className={s.actionBtn} onClick={save} disabled={!canSave}>
            {canSave ? 'Submit' : 'Pick a rating above'}
          </Button>
        </div>

        <div className={p.footer}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span>The score is visible to everyone · only the product team sees your name + note.</span>
        </div>
      </div>
    </>
  );
}
