'use client';

import { clsx } from 'clsx';
import type { ImpactLevel } from '../mocks';
import { IMPACT_LABELS, IMPACT_LEVELS, IMPACT_MAX, IMPACT_VALUE } from '../mocks';
import s from './ImpactControl.module.scss';

interface Props {
  readonly value: ImpactLevel | null;
  readonly onChange: (next: ImpactLevel) => void;
  readonly label?: string;
}

/**
 * The one rating control — a numbered 1..N scale (No impact → High impact) so it reads
 * unmistakably as "rate the impact". Used in the boost popover and the create modal.
 */
export function ImpactControl({ value, onChange, label }: Props) {
  return (
    <div className={s.scale} role="radiogroup" aria-label={label ?? 'Impact to goals'}>
      {IMPACT_LEVELS.map((level) => {
        const active = value === level;
        return (
          <button
            key={level}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={`${IMPACT_LABELS[level]} — ${IMPACT_VALUE[level]} of ${IMPACT_MAX}`}
            className={clsx(s.scaleBtn, active && s.scaleBtnActive)}
            onClick={() => onChange(level)}
          >
            <span className={s.num}>{IMPACT_VALUE[level]}</span>
            {/* Each word on its own line — keeps "High impact" / "No impact" two lines, aligned with single-word levels. */}
            <span className={s.word}>
              {IMPACT_LABELS[level].split(' ').map((w, i) => (
                <span key={i}>{w}</span>
              ))}
            </span>
          </button>
        );
      })}
    </div>
  );
}
