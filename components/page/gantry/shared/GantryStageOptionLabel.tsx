'use client';

import { clsx } from 'clsx';
import { GANTRY_STAGE_LABELS } from '@/services/gantry/constants';
import type { GantryStage } from '@/services/gantry/types';
import s from './GantryFilters.module.scss';

interface Props {
  readonly stage: GantryStage;
}

export function GantryStageOptionLabel({ stage }: Props) {
  return (
    <span className={s.stageFilterLabel}>
      <span className={clsx(s.stageFilterDot, s[`stageFilterDot_${stage}`])} aria-hidden />
      {GANTRY_STAGE_LABELS[stage]}
    </span>
  );
}
