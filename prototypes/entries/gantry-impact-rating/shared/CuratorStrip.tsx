'use client';

import { clsx } from 'clsx';
import type { PerObjectiveImpact } from '../mocks';
import type { ImpactAggregate } from './impact';
import { quadrant } from './impact';
import s from './CuratorStrip.module.scss';

interface Props {
  readonly boostCount: number;
  readonly aggregate: ImpactAggregate;
  /** When provided, renders a per-objective impact breakdown (variant C). */
  readonly objectives?: { uid: string; order: number; title: string }[];
  readonly perObjective?: PerObjectiveImpact[];
}

export function CuratorStrip({ boostCount, aggregate, objectives, perObjective }: Props) {
  const { avgImpact, impactCount, impactDistribution: dist } = aggregate;
  const q = quadrant(boostCount, avgImpact);
  const avg = avgImpact !== null ? avgImpact.toFixed(1) : '—';

  return (
    <div className={s.strip}>
      <span className={s.stripLabel}>Curator view</span>

      <div className={s.row}>
        <span className={clsx(s.quadrant, s[`q_${q.key}`])}>{q.label}</span>
        <span className={s.hint}>{q.hint}</span>
      </div>

      <div className={s.stats}>
        <span>
          <strong>{boostCount}</strong> boosts <span className={s.dim}>(demand)</span>
        </span>
        <span className={s.divider} aria-hidden />
        <span>
          impact <strong>{avg}</strong>
          <span className={s.dim}> / 3 · {impactCount} rated</span>
        </span>
        <span className={s.divider} aria-hidden />
        <span className={s.dim}>
          {dist.high} major · {dist.medium} meaningful · {dist.low} minor
        </span>
      </div>

      {objectives && perObjective && perObjective.length > 0 && (
        <div className={s.objectives}>
          {objectives.map((obj) => {
            const po = perObjective.find((p) => p.objectiveUid === obj.uid);
            return (
              <div key={obj.uid} className={s.objectiveRow}>
                <span className={s.objectiveBadge}>O{obj.order}</span>
                <span className={s.objectiveTitle}>{obj.title}</span>
                <span className={s.objectiveAvg}>{po?.avg != null ? `${po.avg.toFixed(1)} / 3` : '—'}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
