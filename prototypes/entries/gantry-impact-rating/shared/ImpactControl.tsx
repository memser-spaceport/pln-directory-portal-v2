'use client';

import { clsx } from 'clsx';
import type { ImpactLevel } from '../mocks';
import { IMPACT_LABELS, IMPACT_LEVELS } from '../mocks';
import s from './ImpactControl.module.scss';

interface Props {
  readonly value: ImpactLevel | null;
  readonly onChange: (next: ImpactLevel) => void;
  /** Community average (1..3) shown next to the control. */
  readonly avgImpact: number | null;
  readonly ratedByCount: number;
  /** Compact variant for per-objective rows: hides the label + average line. */
  readonly compact?: boolean;
  readonly label?: string;
}

export function ImpactControl({ value, onChange, avgImpact, ratedByCount, compact, label }: Props) {
  return (
    <div className={clsx(s.wrap, compact && s.wrapCompact)}>
      {!compact && <span className={s.label}>{label ?? 'Impact on goals'}</span>}

      <div className={s.segments} role="group" aria-label={label ?? 'Impact on goals'}>
        {IMPACT_LEVELS.map((level) => (
          <button
            key={level}
            type="button"
            className={clsx(s.segment, s[`seg_${level}`], value === level && s.segmentActive)}
            aria-pressed={value === level}
            onClick={() => onChange(level)}
          >
            {IMPACT_LABELS[level]}
          </button>
        ))}
      </div>

      {!compact && (
        <span className={s.meta}>
          {avgImpact !== null ? (
            <>
              avg {avgImpact.toFixed(1)}
              <span className={s.metaDim}> / 3 · {ratedByCount} rated</span>
            </>
          ) : (
            <span className={s.metaDim}>No ratings yet · free &amp; unlimited</span>
          )}
        </span>
      )}
    </div>
  );
}
