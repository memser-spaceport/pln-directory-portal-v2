import { buildContributionHistory, type SnapshotHistoryEntry } from '@/services/plaa/hooks/useProfileData';

function snapshot(periodIso: string, period: string, activityPlaa: number, infra: number): SnapshotHistoryEntry {
  return {
    periodIso,
    period,
    activities: null,
    categories: null,
    points: null,
    activityPlaa,
    hasInfra: infra > 0,
    infra,
    plaaTotal: activityPlaa + infra,
    items: null,
  };
}

// Newest first, matching what toSnapshotHistory produces.
const history: SnapshotHistoryEntry[] = [
  snapshot('2026-03-26', 'Mar 2026', 50, 0),
  snapshot('2026-02-26', 'Feb 2026', 20, 30),
  snapshot('2026-01-26', 'Jan 2026', 10, 0),
];

describe('buildContributionHistory', () => {
  it('runs the cumulative balance oldest first', () => {
    const result = buildContributionHistory(history, {}, {});

    expect(result.map((e) => e.period)).toEqual(['Jan 2026', 'Feb 2026', 'Mar 2026']);
    expect(result.map((e) => e.cum)).toEqual([10, 60, 110]);
  });

  it('attributes a redemption to the month its auction closed in', () => {
    const result = buildContributionHistory(history, { '2026-02': 500 }, {});

    expect(result.map((e) => e.redeemed)).toEqual([null, 500, null]);
  });

  it('matches a redemption on year-month, since snapshot rows carry a day-of-month and auctions close on the first', () => {
    const result = buildContributionHistory(history, { '2026-03': 120 }, {});

    expect(result.find((e) => e.period === 'Mar 2026')?.redeemed).toBe(120);
  });

  it('leaves redeemed null for months with no redemption, never zero', () => {
    const result = buildContributionHistory(history, { '2026-01': 40 }, {});

    expect(result.find((e) => e.period === 'Feb 2026')?.redeemed).toBeNull();
  });

  it('marks a row pending when its period is not a closed snapshot', () => {
    const result = buildContributionHistory(history, {}, { '2026-01': true, '2026-02': true, '2026-03': false });

    expect(result.map((e) => e.isPending)).toEqual([false, false, true]);
  });

  it('does not mark rows pending when no lifecycle data has loaded, rather than claiming every row is provisional', () => {
    const result = buildContributionHistory(history, {}, {});

    expect(result.every((e) => e.isPending === false)).toBe(true);
  });
});
