'use client';

import { clsx } from 'clsx';
import { GANTRY_IMPACT_LABELS, GANTRY_IMPACT_MAX, GANTRY_IMPACT_VALUES } from '@/services/gantry/constants';
import type { GantryImpactValue } from '@/services/gantry/types';
import s from './ImpactControl.module.scss';

interface Props {
  readonly value: GantryImpactValue | null;
  readonly onChange: (next: GantryImpactValue) => void;
  readonly label?: string;
  readonly disabled?: boolean;
}

/**
 * The one rating control — a numbered 1..5 scale with every level's word visible so the
 * rating is unmistakable. Used in the boost popover and the create/edit forms.
 */
export function ImpactControl({ value, onChange, label, disabled }: Props) {
  return (
    <div className={s.scale} role="radiogroup" aria-label={label ?? 'Impact on company goals'}>
      {GANTRY_IMPACT_VALUES.map((impact) => {
        const active = value === impact;
        return (
          <button
            key={impact}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={`${GANTRY_IMPACT_LABELS[impact]} — ${impact} of ${GANTRY_IMPACT_MAX}`}
            className={clsx(s.scaleBtn, active && s.scaleBtnActive)}
            disabled={disabled}
            onClick={() => onChange(impact)}
          >
            <span className={s.num}>{impact}</span>
            <span className={s.word}>{GANTRY_IMPACT_LABELS[impact]}</span>
          </button>
        );
      })}
    </div>
  );
}
