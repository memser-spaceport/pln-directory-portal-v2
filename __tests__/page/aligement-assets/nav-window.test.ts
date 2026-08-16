import { MONTHLY_WINDOW, takeRecentMonths } from '@/components/page/aligement-assets/trust-holdings/nav-window';
import { NavPoint } from '@/services/plaa/trust-holdings.service';

const point = (label: string): NavPoint => ({
  label,
  date: `${label}-01`,
  totalPlaa: 1000,
  nav: 1000,
  navPerPlaa: 10,
  treasuries: 500,
  btc: 100,
  eth: 100,
  fil: 100,
  plvh: 200,
});

const series = (count: number) => Array.from({ length: count }, (_, i) => point(`m${i + 1}`));

describe('takeRecentMonths', () => {
  it('defaults to a 12-month window', () => {
    expect(MONTHLY_WINDOW).toBe(12);
    expect(takeRecentMonths(series(24))).toHaveLength(12);
  });

  it('keeps the most recent months, not the earliest', () => {
    // The window ends at the latest point in the series, so a 14-month series
    // drops m1 and m2 rather than truncating the tail.
    const windowed = takeRecentMonths(series(14));
    expect(windowed[0].label).toBe('m3');
    expect(windowed[windowed.length - 1].label).toBe('m14');
  });

  it('rolls forward as new months arrive', () => {
    const before = takeRecentMonths(series(12));
    const after = takeRecentMonths([...series(12), point('m13')]);
    expect(before[0].label).toBe('m1');
    expect(after[0].label).toBe('m2');
    expect(after[after.length - 1].label).toBe('m13');
  });

  it('returns a full series shorter than the window unpadded', () => {
    const windowed = takeRecentMonths(series(5));
    expect(windowed).toHaveLength(5);
    expect(windowed.map((p) => p.label)).toEqual(['m1', 'm2', 'm3', 'm4', 'm5']);
  });

  it('returns exactly the series when it matches the window', () => {
    expect(takeRecentMonths(series(12))).toHaveLength(12);
  });

  it('handles empty and missing series', () => {
    expect(takeRecentMonths([])).toEqual([]);
    expect(takeRecentMonths(undefined)).toEqual([]);
  });

  it('does not mutate or reorder the source series', () => {
    const source = series(14);
    const snapshot = source.map((p) => p.label);
    takeRecentMonths(source);
    expect(source.map((p) => p.label)).toEqual(snapshot);
  });

  it('honours a custom window size', () => {
    expect(takeRecentMonths(series(14), 3).map((p) => p.label)).toEqual(['m12', 'm13', 'm14']);
    expect(takeRecentMonths(series(14), 0)).toEqual([]);
  });
});
