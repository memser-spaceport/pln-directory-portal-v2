'use client';

import { clsx } from 'clsx';
import type { ImpactAggregate } from './impact';
import s from './ImpactBadge.module.scss';

/** Concentric-circles "target" icon — impact's visual counterpart to the boost arrow. */
function TargetIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden>
      <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="6" cy="6" r="1.8" fill="currentColor" />
    </svg>
  );
}

interface Props {
  readonly aggregate: ImpactAggregate;
  /** Tints the badge when the viewer has contributed a rating. */
  readonly hasRated: boolean;
}

export function ImpactBadge({ aggregate, hasRated }: Props) {
  const { avgImpact, impactCount, impactDistribution: dist } = aggregate;
  const avg = avgImpact !== null ? avgImpact.toFixed(1) : '–';
  const tooltip =
    impactCount > 0
      ? `Impact on goals: avg ${avg} / 3 — ${impactCount} rated (${dist.high} major · ${dist.medium} meaningful · ${dist.low} minor)${hasRated ? ' · you rated' : ''}`
      : 'Impact on goals: no ratings yet';

  return (
    <span className={clsx(s.badge, hasRated && s.badgeRated)} title={tooltip} aria-label={tooltip}>
      <TargetIcon />
      <span className={s.avg}>{avg}</span>
      {impactCount > 0 && <span className={s.count}>· {impactCount}</span>}
    </span>
  );
}
