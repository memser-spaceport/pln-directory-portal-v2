'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import { clsx } from 'clsx';
import { useIsNarrow } from '@/hooks/useIsNarrow';
import { Button } from '@/components/common/Button';
import { PushPinIcon } from '@/components/icons/PushPinIcon';
import { CloseIcon } from '@/components/icons/CloseIcon';
import { GANTRY_IMPACT_PER_OBJECTIVE_ENABLED } from '@/utils/feature-flags';
import type { GantryImpactValue, GantryObjectiveImpacts } from '@/services/gantry/types';
import { ImpactControl } from './ImpactControl';
import p from './PinNotePopover.module.scss';
import s from './BoostImpactPopover.module.scss';

const MAX_NOTE = 500;

export interface BoostImpactRating {
  impact: GantryImpactValue | null;
  note: string;
  /** Per-objective breakdown — populated only when GANTRY_IMPACT_PER_OBJECTIVE_ENABLED. */
  objectiveImpacts?: GantryObjectiveImpacts;
}

interface Props {
  readonly pos: { top: number; left: number };
  /** The item's assigned objectives — rated individually when the per-objective switch is on. */
  readonly objectives?: { uid: string; order: number; title: string }[];
  /** Pre-fill for a viewer who already has a rating on this item (e.g. the item's author). */
  readonly initialImpact?: GantryImpactValue | null;
  /** Single-flight: while the pin mutation is committing, Save is disabled and dismissal is a no-op. */
  readonly isSaving?: boolean;
  /** Boost commits here; impact rating is optional. */
  readonly onSave: (rating: BoostImpactRating) => void;
  /** Dismissing without saving cancels the boost entirely (nothing was committed). */
  readonly onCancel: () => void;
}

export function BoostImpactPopover({ pos, objectives, initialImpact, isSaving, onSave, onCancel }: Props) {
  const [impact, setImpact] = useState<GantryImpactValue | null>(initialImpact ?? null);
  const [objectiveImpacts, setObjectiveImpacts] = useState<GantryObjectiveImpacts>({});
  const [note, setNote] = useState('');
  const ratedObjectives = GANTRY_IMPACT_PER_OBJECTIVE_ENABLED ? (objectives ?? []) : [];

  // On narrow screens the anchored popover becomes a bottom sheet (docked, full-width) — no
  // viewport math needed. On desktop, keep it fully on-screen: it grows taller once a rating is
  // picked (note block appears), so measure the real height and pull the top up whenever it
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
  }, [pos.top, impact, isNarrow]);

  const canSave = !isSaving;
  const save = () =>
    !isSaving &&
    onSave({
      impact,
      note: note.trim(),
      ...(Object.keys(objectiveImpacts).length > 0 ? { objectiveImpacts } : {}),
    });
  const cancel = () => !isSaving && onCancel();

  return (
    <>
      <div className={p.backdrop} onClick={cancel} />
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
            <h4 className={clsx(p.title, s.title)}>Impact to goals</h4>
          </div>
          <button type="button" className={p.closeBtn} onClick={cancel} aria-label="Cancel boost">
            <CloseIcon width={14} height={14} />
          </button>
        </div>

        <div className={p.body}>
          <ImpactControl
            value={impact}
            onChange={setImpact}
            label="How much will this move our company goals?"
            disabled={isSaving}
          />

          {ratedObjectives.length > 0 && (
            <div className={s.objectiveRows}>
              <span className={s.objectiveRowsLabel}>Break it down by goal (optional)</span>
              {ratedObjectives.map((obj) => (
                <div key={obj.uid} className={s.objectiveRow}>
                  <span className={s.objectiveLabel}>
                    <span className={s.objectiveBadge}>O{obj.order}</span>
                    <span className={s.objectiveTitle}>{obj.title}</span>
                  </span>
                  <ImpactControl
                    value={objectiveImpacts[obj.uid] ?? null}
                    onChange={(next) => setObjectiveImpacts((prev) => ({ ...prev, [obj.uid]: next }))}
                    label={`Impact on ${obj.title}`}
                    disabled={isSaving}
                  />
                </div>
              ))}
            </div>
          )}

          {/* The "why" note appears only after an impact level is picked. */}
          {impact !== null && (
            <div className={s.noteBlock}>
              <textarea
                className={p.textarea}
                maxLength={MAX_NOTE}
                placeholder="Why this rating? (optional) e.g. blocking my work, needed for the August launch…"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                disabled={isSaving}
                autoFocus
              />
              <div className={p.charCount}>
                {note.length} / {MAX_NOTE}
              </div>
            </div>
          )}
        </div>

        <div className={p.actions}>
          <Button style="border" variant="neutral" className={s.actionBtn} onClick={cancel} disabled={isSaving}>
            Cancel
          </Button>
          <Button className={s.actionBtn} onClick={save} disabled={!canSave}>
            {isSaving ? 'Submitting…' : 'Submit'}
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
