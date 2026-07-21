import { GANTRY_IMPACT_VALUES } from './constants';
import type { GantryImpactDistribution, GantryImpactValue, GantryItem } from './types';

export type GantryItemImpactAggregate = Pick<GantryItem, 'avgImpact' | 'impactCount' | 'impactDistribution'>;

export interface GantryImpactChange {
  prev: GantryImpactValue | null;
  next: GantryImpactValue | null;
}

const EMPTY_AGGREGATE: GantryItemImpactAggregate = { avgImpact: null, impactCount: 0, impactDistribution: null };

function emptyDistribution(): GantryImpactDistribution {
  return { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
}

/** The single gate for every impact surface: no ratings ⇒ no impact UI (legacy items). */
export function hasImpactData(item: Pick<GantryItem, 'impactCount'>): boolean {
  return item.impactCount > 0;
}

/**
 * Optimistic-update math. The distribution is canonical: the change patches a bucket and
 * count/average are re-derived from it, so the three fields can never drift apart.
 */
export function applyImpactChange(
  aggregate: GantryItemImpactAggregate,
  change: GantryImpactChange,
): GantryItemImpactAggregate {
  if (change.prev === change.next) return aggregate;

  const distribution = { ...(aggregate.impactDistribution ?? emptyDistribution()) };
  if (change.prev !== null) distribution[change.prev] = Math.max(0, distribution[change.prev] - 1);
  if (change.next !== null) distribution[change.next] += 1;

  let impactCount = 0;
  let total = 0;
  for (const value of GANTRY_IMPACT_VALUES) {
    impactCount += distribution[value];
    total += distribution[value] * value;
  }

  if (impactCount === 0) return { ...EMPTY_AGGREGATE };
  return { avgImpact: total / impactCount, impactCount, impactDistribution: distribution };
}

export function toImpactValue(raw: unknown): GantryImpactValue | null {
  const num = typeof raw === 'string' ? Number(raw) : raw;
  return (GANTRY_IMPACT_VALUES as readonly unknown[]).includes(num) ? (num as GantryImpactValue) : null;
}

function toImpactDistribution(raw: unknown): GantryImpactDistribution | null {
  if (raw == null || typeof raw !== 'object') return null;
  const source = raw as Record<string, unknown>;
  const distribution = emptyDistribution();
  let total = 0;
  for (const value of GANTRY_IMPACT_VALUES) {
    const bucket = Number(source[String(value)] ?? 0);
    distribution[value] = Number.isFinite(bucket) && bucket > 0 ? bucket : 0;
    total += distribution[value];
  }
  return total > 0 ? distribution : null;
}

/**
 * Applied at the service parse boundary in ALL modes (off / mock / on): the live API doesn't
 * return impact fields yet, so absent values are normalized (never `undefined`) and the
 * distribution's JSON string keys become the typed numeric record. This is also the single
 * adjustment point if field names shift when the backend deploys.
 */
export function normalizeGantryItemImpact(item: GantryItem): GantryItem {
  const raw = item as GantryItem & Record<string, unknown>;
  return {
    ...item,
    authorImpact: toImpactValue(raw.authorImpact),
    authorImpactReasoning: typeof raw.authorImpactReasoning === 'string' ? raw.authorImpactReasoning : null,
    avgImpact: typeof raw.avgImpact === 'number' && Number.isFinite(raw.avgImpact) ? raw.avgImpact : null,
    impactCount: typeof raw.impactCount === 'number' && raw.impactCount > 0 ? raw.impactCount : 0,
    impactDistribution: toImpactDistribution(raw.impactDistribution),
    viewerImpact: toImpactValue(raw.viewerImpact),
    pins: item.pins?.map((pin) => ({ ...pin, impact: toImpactValue(pin.impact) })),
  };
}
