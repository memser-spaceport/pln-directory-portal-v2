import { LEADERBOARD_SIZE, toRows } from '@/components/page/aligement-assets/leaderboard/leaderboard.mapper';

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
