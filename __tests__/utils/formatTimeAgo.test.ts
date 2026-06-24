import { formatTimeAgo } from '@/utils/formatTimeAgo';

describe('formatTimeAgo', () => {
  it('returns "" for null, undefined and empty input', () => {
    expect(formatTimeAgo(null)).toBe('');
    expect(formatTimeAgo(undefined)).toBe('');
    expect(formatTimeAgo('')).toBe('');
  });

  it('returns "" for an unparseable date (Invalid Date does not throw)', () => {
    expect(formatTimeAgo('not-a-date')).toBe('');
  });

  it('returns "" for a future date (never "in 3 weeks ago")', () => {
    const future = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString();
    expect(formatTimeAgo(future)).toBe('');
  });

  it('formats a past date with an "ago" suffix', () => {
    const threeWeeksAgo = new Date(Date.now() - 1000 * 60 * 60 * 24 * 21).toISOString();
    const out = formatTimeAgo(threeWeeksAgo);
    expect(out).not.toBe('');
    expect(out).toMatch(/ago$/);
  });

  it('abbreviates recent durations', () => {
    const twoHoursAgo = new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString();
    expect(formatTimeAgo(twoHoursAgo)).toBe('2h ago');
  });
});
