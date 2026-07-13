import type { ImpactData, ImpactLevel } from '../mocks';
import { IMPACT_VALUE } from '../mocks';

/** Thresholds that split the demand × impact matrix (tuned for the mock seeds). */
export const DEMAND_HIGH_AT = 15; // boostCount at/above this reads as high demand
export const IMPACT_HIGH_AT = 2; // avgImpact at/above this (of 3) reads as high impact

export interface ImpactAggregate {
  impactCount: number;
  avgImpact: number | null;
  impactDistribution: { low: number; medium: number; high: number };
}

/**
 * Re-derives the community aggregate as the viewer changes their own rating, so the
 * prototype feels live. The mock ships with the viewer's original vote already baked
 * into the distribution, so we remove that and fold in the current selection.
 */
export function deriveAggregate(base: ImpactData, viewerImpact: ImpactLevel | null): ImpactAggregate {
  const dist = { ...base.impactDistribution };

  if (base.viewerImpact) dist[base.viewerImpact] = Math.max(0, dist[base.viewerImpact] - 1);
  if (viewerImpact) dist[viewerImpact] += 1;

  const count = dist.low + dist.medium + dist.high;
  const total = dist.low * IMPACT_VALUE.low + dist.medium * IMPACT_VALUE.medium + dist.high * IMPACT_VALUE.high;
  const avgImpact = count > 0 ? total / count : null;

  return { impactCount: count, avgImpact, impactDistribution: dist };
}

export type QuadrantKey = 'do-first' | 'manage' | 'evangelize' | 'backlog';

export interface Quadrant {
  key: QuadrantKey;
  label: string;
  hint: string;
}

export function quadrant(boostCount: number, avgImpact: number | null): Quadrant {
  const highDemand = boostCount >= DEMAND_HIGH_AT;
  const highImpact = (avgImpact ?? 0) >= IMPACT_HIGH_AT;

  if (highDemand && highImpact) {
    return { key: 'do-first', label: 'Do first', hint: 'Loud and load-bearing' };
  }
  if (highDemand) {
    return { key: 'manage', label: 'Manage expectations', hint: 'Wanted, but low goal impact' };
  }
  if (highImpact) {
    return { key: 'evangelize', label: 'Evangelize', hint: 'High impact the crowd is sleeping on' };
  }
  return { key: 'backlog', label: 'Backlog', hint: 'Low demand, low impact' };
}
