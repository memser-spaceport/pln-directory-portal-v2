import clsx from 'clsx';
import type { GantryStage } from '@/services/gantry/types';
import { GANTRY_STAGE_LABELS } from '@/services/gantry/constants';
import s from './Shared.module.scss';

interface Props {
  readonly stage: GantryStage;
  readonly className?: string;
}

export function StageBadge({ stage, className }: Props) {
  return (
    <span className={clsx(s.stageBadge, s[`stage_${stage}`], className)}>{GANTRY_STAGE_LABELS[stage]}</span>
  );
}
