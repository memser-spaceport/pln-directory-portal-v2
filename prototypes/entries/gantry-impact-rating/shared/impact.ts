import type { ImpactData, ImpactDistribution, ImpactLevel, PerObjectiveImpact } from '../mocks';
import { IMPACT_VALUE } from '../mocks';

/** The two mutually-exclusive versions: predefined objectives, or the author's free-text reasoning. */
export type GoalMode = 'objectives' | 'reasoning';

export interface ImpactAggregate {
  impactCount: number;
  avgImpact: number | null;
  impactDistribution: ImpactDistribution;
}

/**
 * Re-derives the community aggregate as the viewer changes their own rating, so the
 * prototype feels live. The mock ships with the viewer's original rating already baked
 * into the distribution, so we remove that and fold in the current selection.
 */
export function deriveAggregate(base: ImpactData, viewerImpact: ImpactLevel | null): ImpactAggregate {
  const dist = { ...base.impactDistribution };

  if (base.viewerImpact) dist[base.viewerImpact] = Math.max(0, dist[base.viewerImpact] - 1);
  if (viewerImpact) dist[viewerImpact] += 1;

  let count = 0;
  let total = 0;
  (Object.keys(dist) as ImpactLevel[]).forEach((level) => {
    count += dist[level];
    total += dist[level] * IMPACT_VALUE[level];
  });

  return { impactCount: count, avgImpact: count > 0 ? total / count : null, impactDistribution: dist };
}

/** Folds the viewer's per-objective rating on top of the base community aggregate. */
export function foldObjectiveImpact(
  po: PerObjectiveImpact,
  viewerLevel: ImpactLevel | null | undefined,
): PerObjectiveImpact {
  if (!viewerLevel) return po;
  const baseTotal = (po.avg ?? 0) * po.count;
  const count = po.count + 1;
  return { ...po, avg: (baseTotal + IMPACT_VALUE[viewerLevel]) / count, count };
}
