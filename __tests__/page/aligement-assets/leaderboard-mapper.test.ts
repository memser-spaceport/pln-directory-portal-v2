import {
  LEADERBOARD_SIZE,
  toRows,
  toSnapshot,
} from '@/components/page/aligement-assets/leaderboard/leaderboard.mapper';
import type { RoundStatsResponse } from '@/services/plaa/rounds.service';

const entry = (rank: number, points: number) => ({ rank, name: `Member ${rank}`, activities: '', points });

describe('toRows', () => {
  it('keeps only the top contributors', () => {
    const entries = Array.from({ length: 25 }, (_, i) => entry(i + 1, 1000 - i));

    const rows = toRows(entries, []);

    expect(LEADERBOARD_SIZE).toBe(10);
    expect(rows).toHaveLength(LEADERBOARD_SIZE);
    expect(rows.map((row) => row.rank)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  it('leaves out members with no points', () => {
    const rows = toRows([entry(1, 500), entry(2, 30), entry(3, 0), entry(4, 0)], []);

    expect(rows.map((row) => row.name)).toEqual(['Member 1', 'Member 2']);
  });

  it('returns no rows when nobody has points yet', () => {
    expect(toRows([entry(1, 0), entry(2, 0)], [])).toEqual([]);
  });
});

describe('toSnapshot', () => {
  const stats = (overrides: Partial<RoundStatsResponse>): RoundStatsResponse => ({
    roundNumber: 19,
    period: '2026-08-01',
    month: 'August',
    year: 2026,
    isCurrentRound: false,
    lastUpdated: '',
    chart: [
      { name: 'Programs', value: 1200 },
      { name: 'People/Talent', value: 300 },
    ],
    tokenChart: [
      { name: 'Programs', value: 2500 },
      { name: 'People / Talent', value: 1500 },
    ],
    totalPointsCollected: 1500,
    onboardedParticipants: 40,
    incentivizedActivities: [],
    regionsUnlocked: [],
    labweek25IncentivizedActivities: [],
    buyback: null,
    ...overrides,
  });

  it('pairs each category with the PLAA it converted into', () => {
    const snapshot = toSnapshot(stats({}));

    expect(snapshot.categories).toEqual([
      { name: 'Programs', value: 1200, plaa: 2500 },
      { name: 'People/Talent', value: 300, plaa: 1500 },
    ]);
    expect(snapshot.plaaDistributed).toBe(4000);
  });

  it('reports no PLAA for a category or round that has not converted', () => {
    const snapshot = toSnapshot(stats({ isCurrentRound: true, tokenChart: [] }));

    expect(snapshot.categories.map((category) => category.plaa)).toEqual([0, 0]);
    expect(snapshot.plaaDistributed).toBe(0);
  });

  it('leaves out categories that are not in the KPI schedule, such as Capital', () => {
    const snapshot = toSnapshot(stats({ chart: [...stats({}).chart, { name: 'Capital', value: 0 }] }), [
      'Programs',
      'People / Talent',
    ]);

    expect(snapshot.categories.map((category) => category.name)).toEqual(['Programs', 'People/Talent']);
  });
});
