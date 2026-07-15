import {
  applyImpactChange,
  hasImpactData,
  normalizeGantryItemImpact,
  toImpactValue,
  type GantryItemImpactAggregate,
} from '@/services/gantry/impact';
import type { GantryItem } from '@/services/gantry/types';

const emptyAggregate: GantryItemImpactAggregate = { avgImpact: null, impactCount: 0, impactDistribution: null };

describe('applyImpactChange', () => {
  it('adds the first rating, creating the distribution', () => {
    const result = applyImpactChange(emptyAggregate, { prev: null, next: 4 });

    expect(result.impactCount).toBe(1);
    expect(result.avgImpact).toBe(4);
    expect(result.impactDistribution).toEqual({ 1: 0, 2: 0, 3: 0, 4: 1, 5: 0 });
  });

  it('changes an existing rating without altering the count', () => {
    const base = applyImpactChange(emptyAggregate, { prev: null, next: 2 });
    const withSecond = applyImpactChange(base, { prev: null, next: 4 });

    const result = applyImpactChange(withSecond, { prev: 2, next: 5 });

    expect(result.impactCount).toBe(2);
    expect(result.avgImpact).toBe(4.5);
    expect(result.impactDistribution).toEqual({ 1: 0, 2: 0, 3: 0, 4: 1, 5: 1 });
  });

  it('removing the last rating returns the empty aggregate (null avg + distribution)', () => {
    const base = applyImpactChange(emptyAggregate, { prev: null, next: 3 });

    const result = applyImpactChange(base, { prev: 3, next: null });

    expect(result).toEqual(emptyAggregate);
  });

  it('removing one of several ratings re-derives the average from the distribution', () => {
    let aggregate = emptyAggregate;
    aggregate = applyImpactChange(aggregate, { prev: null, next: 1 });
    aggregate = applyImpactChange(aggregate, { prev: null, next: 5 });
    aggregate = applyImpactChange(aggregate, { prev: null, next: 3 });

    const result = applyImpactChange(aggregate, { prev: 5, next: null });

    expect(result.impactCount).toBe(2);
    expect(result.avgImpact).toBe(2);
  });

  it('is a no-op when prev equals next', () => {
    const base = applyImpactChange(emptyAggregate, { prev: null, next: 4 });

    expect(applyImpactChange(base, { prev: 4, next: 4 })).toBe(base);
  });

  it('never drives a bucket below zero on a stale prev', () => {
    const result = applyImpactChange(emptyAggregate, { prev: 2, next: 4 });

    expect(result.impactDistribution).toEqual({ 1: 0, 2: 0, 3: 0, 4: 1, 5: 0 });
    expect(result.impactCount).toBe(1);
  });

  it('does not mutate its input aggregate', () => {
    const base = applyImpactChange(emptyAggregate, { prev: null, next: 4 });
    const snapshot = JSON.parse(JSON.stringify(base));

    applyImpactChange(base, { prev: 4, next: 2 });

    expect(base).toEqual(snapshot);
  });
});

describe('hasImpactData', () => {
  it('is the single hide gate: zero count hides, any count shows', () => {
    expect(hasImpactData({ impactCount: 0 })).toBe(false);
    expect(hasImpactData({ impactCount: 1 })).toBe(true);
  });
});

describe('toImpactValue', () => {
  it('accepts 1..5 (numeric or string-encoded) and rejects everything else', () => {
    expect(toImpactValue(3)).toBe(3);
    expect(toImpactValue('5')).toBe(5);
    expect(toImpactValue(0)).toBeNull();
    expect(toImpactValue(6)).toBeNull();
    expect(toImpactValue(2.5)).toBeNull();
    expect(toImpactValue(null)).toBeNull();
    expect(toImpactValue(undefined)).toBeNull();
    expect(toImpactValue('high')).toBeNull();
  });
});

describe('normalizeGantryItemImpact', () => {
  const rawItem = (overrides: Record<string, unknown>): GantryItem =>
    ({
      uid: 'item-1',
      title: 'Need',
      pinCount: 0,
      ...overrides,
    }) as unknown as GantryItem;

  it('normalizes absent fields (pre-backend API) to null/0 so equality checks never misfire', () => {
    const result = normalizeGantryItemImpact(rawItem({}));

    expect(result.authorImpact).toBeNull();
    expect(result.authorImpactReasoning).toBeNull();
    expect(result.avgImpact).toBeNull();
    expect(result.impactCount).toBe(0);
    expect(result.impactDistribution).toBeNull();
    expect(result.viewerImpact).toBeNull();
  });

  it('parses the string-keyed JSON distribution into the typed numeric record', () => {
    const result = normalizeGantryItemImpact(
      rawItem({
        avgImpact: 4.5,
        impactCount: 2,
        impactDistribution: { '4': 1, '5': 1 },
        authorImpact: 5,
        viewerImpact: 4,
      }),
    );

    expect(result.impactDistribution).toEqual({ 1: 0, 2: 0, 3: 0, 4: 1, 5: 1 });
    expect(result.avgImpact).toBe(4.5);
    expect(result.impactCount).toBe(2);
    expect(result.authorImpact).toBe(5);
    expect(result.viewerImpact).toBe(4);
  });

  it('nulls an all-zero distribution and normalizes legacy pins to impact null', () => {
    const result = normalizeGantryItemImpact(
      rawItem({
        impactDistribution: { '1': 0 },
        pins: [
          {
            uid: 'pin-1',
            note: null,
            createdAt: '',
            releasedAt: null,
            member: { uid: 'm', name: 'A', imageUrl: null },
          },
          {
            uid: 'pin-2',
            note: 'why now',
            impact: 4,
            createdAt: '',
            releasedAt: null,
            member: { uid: 'm2', name: 'B', imageUrl: null },
          },
        ],
      }),
    );

    expect(result.impactDistribution).toBeNull();
    expect(result.pins?.[0].impact).toBeNull();
    expect(result.pins?.[1].impact).toBe(4);
  });
});
