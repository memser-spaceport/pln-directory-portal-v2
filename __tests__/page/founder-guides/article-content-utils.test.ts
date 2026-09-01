import { formatCount } from '@/components/page/founder-guides/ArticleContent/utils/formatCount';
import { formatDate } from '@/components/page/founder-guides/ArticleContent/utils/formatDate';
import { resolveMemberImageUrl } from '@/components/page/founder-guides/ArticleContent/utils/resolveMemberImageUrl';

describe('formatCount', () => {
  it('leaves anything under a thousand as a plain number', () => {
    expect(formatCount(0)).toBe('0');
    expect(formatCount(7)).toBe('7');
    expect(formatCount(999)).toBe('999');
  });

  it('switches to "k" at exactly a thousand, with no trailing .0', () => {
    expect(formatCount(1000)).toBe('1k');
    expect(formatCount(2000)).toBe('2k');
  });

  it('keeps one decimal when it carries information', () => {
    expect(formatCount(1100)).toBe('1.1k');
    expect(formatCount(12500)).toBe('12.5k');
  });

  it('rounds to that one decimal rather than truncating', () => {
    expect(formatCount(1140)).toBe('1.1k');
    expect(formatCount(1160)).toBe('1.2k');
    expect(formatCount(1990)).toBe('2k');
  });

  // toFixed rounds the binary double, and 1.15 is stored as 1.1499999…, so the
  // exact .x5 tie rounds down. Pinned so a future switch to Math.round reads as
  // a deliberate change rather than an accident.
  it('rounds an exact .x5 tie down, following toFixed', () => {
    expect(formatCount(1150)).toBe('1.1k');
  });

  it('handles counts past a million without inventing a new suffix', () => {
    expect(formatCount(1_000_000)).toBe('1000k');
  });
});

describe('formatDate', () => {
  it('renders an ISO timestamp as a short US date', () => {
    expect(formatDate('2026-06-08T12:00:00.000Z')).toBe('Jun 8, 2026');
  });

  it('spells the month rather than numbering it, so 06/08 is never read as August', () => {
    expect(formatDate('2026-06-08T12:00:00.000Z')).toContain('Jun');
  });

  it('does not pad the day', () => {
    expect(formatDate('2026-01-01T12:00:00.000Z')).toBe('Jan 1, 2026');
  });

  it('accepts a date-only string', () => {
    expect(formatDate('2026-12-25')).toBe('Dec 25, 2026');
  });

  it('returns something rather than throwing on an unparseable value', () => {
    expect(formatDate('not-a-date')).toBe('Invalid Date');
  });
});

describe('resolveMemberImageUrl', () => {
  it('passes a plain URL string through', () => {
    expect(resolveMemberImageUrl('https://cdn.example.com/a.png')).toBe('https://cdn.example.com/a.png');
  });

  it('unwraps the object form the API also sends', () => {
    expect(resolveMemberImageUrl({ url: 'https://cdn.example.com/b.png' })).toBe('https://cdn.example.com/b.png');
  });

  it('returns null for a member with no image, so the caller can fall back', () => {
    expect(resolveMemberImageUrl(null)).toBeNull();
    expect(resolveMemberImageUrl(undefined)).toBeNull();
  });

  it('returns null for an object whose url is missing', () => {
    expect(resolveMemberImageUrl({} as { url: string })).toBeNull();
    expect(resolveMemberImageUrl({ url: null } as unknown as { url: string })).toBeNull();
  });

  it("passes an empty string through — emptiness is the caller's to judge", () => {
    expect(resolveMemberImageUrl('')).toBe('');
  });
});
