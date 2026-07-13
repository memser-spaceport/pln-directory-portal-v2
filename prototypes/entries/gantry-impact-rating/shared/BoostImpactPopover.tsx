'use client';

// Prototype-local extension of production PinNotePopover (per prototypes/README "copy & simplify"):
// the same post-boost "Boosted!" moment, now also asking the impact-on-goals question. Reuses the
// production popover chrome (module scss imported read-only); only the impact section is local.

import { useState } from 'react';
import { clsx } from 'clsx';
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
  readonly onSkip: () => void;
}

export function BoostImpactPopover({ pos, objectives, onSave, onSkip }: Props) {
  const [overall, setOverall] = useState<ImpactLevel | null>(null);
  const [perObjective, setPerObjective] = useState<Record<string, ImpactLevel>>({});
  const [note, setNote] = useState('');

  const save = () => onSave({ overall, perObjective, note: note.trim() });
  // Backdrop / close behave like production: keep the boost, save whatever was set.
  const dismiss = () => (overall || Object.keys(perObjective).length > 0 || note.trim() ? save() : onSkip());

  return (
    <>
      <div className={p.backdrop} onClick={dismiss} />
      <div className={clsx(p.popover, s.popoverGuard)} style={{ top: pos.top, left: pos.left }}>
        <div className={p.head}>
          <span className={p.pinIconWrap} aria-hidden>
            <PushPinIcon width={16} height={16} />
          </span>
          <div className={p.headText}>
            <h4 className={p.title}>Boosted!</h4>
            <p className={p.sub}>How much would this move the goals? (optional)</p>
          </div>
          <button type="button" className={p.closeBtn} onClick={dismiss} aria-label="Close">
            <CloseIcon width={14} height={14} />
          </button>
        </div>

        <div className={p.body}>
          <div className={s.impactRow}>
            <ImpactControl compact value={overall} onChange={setOverall} avgImpact={null} ratedByCount={0} />
          </div>

          {objectives && objectives.length > 0 && (
            <div className={s.objectiveRows}>
              {objectives.map((obj) => (
                <div key={obj.uid} className={s.objectiveRow}>
                  <span className={s.objectiveLabel}>
                    <span className={s.objectiveBadge}>O{obj.order}</span>
                    <span className={s.objectiveTitle}>{obj.title}</span>
                  </span>
                  <ImpactControl
                    compact
                    value={perObjective[obj.uid] ?? null}
                    onChange={(next) => setPerObjective((prev) => ({ ...prev, [obj.uid]: next }))}
                    avgImpact={null}
                    ratedByCount={0}
                    label={`Impact on ${obj.title}`}
                  />
                </div>
              ))}
            </div>
          )}

          <textarea
            className={p.textarea}
            maxLength={MAX_NOTE}
            placeholder="Why now? e.g. blocking my work, needed for a launch…"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
          />
          <div className={p.charCount}>
            {note.length} / {MAX_NOTE}
          </div>
        </div>

        <div className={p.actions}>
          <button type="button" className={p.skipBtn} onClick={onSkip}>
            Skip
          </button>
          <button type="button" className={p.saveBtn} onClick={save}>
            Save
          </button>
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
          <span>Anonymous to members · only the product team sees your name, rating + note.</span>
        </div>
      </div>
    </>
  );
}
