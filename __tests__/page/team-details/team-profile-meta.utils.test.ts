import { formatFoundedYear } from '@/components/page/team-details/TeamDetails/components/TeamProfileMeta/utils/formatFoundedYear';
import { formatTeamSize } from '@/components/page/team-details/TeamDetails/components/TeamProfileMeta/utils/formatTeamSize';

describe('formatFoundedYear', () => {
  it('renders a 4-digit year', () => {
    expect(formatFoundedYear(2014)).toBe('Founded 2014');
  });

  it('accepts a numeric string', () => {
    expect(formatFoundedYear('2014')).toBe('Founded 2014');
  });

  it('renders nothing when unset', () => {
    expect(formatFoundedYear(null)).toBeUndefined();
    expect(formatFoundedYear(undefined)).toBeUndefined();
    expect(formatFoundedYear('')).toBeUndefined();
  });

  it('renders nothing outside the year bounds the API enforces', () => {
    expect(formatFoundedYear(999)).toBeUndefined();
    expect(formatFoundedYear(10000)).toBeUndefined();
    expect(formatFoundedYear(2014.5)).toBeUndefined();
    expect(formatFoundedYear('not a year')).toBeUndefined();
  });
});

describe('formatTeamSize', () => {
  it('renders a bare count', () => {
    expect(formatTeamSize('50')).toBe('50 people');
    expect(formatTeamSize(50)).toBe('50 people');
  });

  it('normalizes a hyphenated range to an en dash', () => {
    expect(formatTeamSize('201-500')).toBe('201–500 people');
  });

  it('leaves an already en-dashed range alone', () => {
    expect(formatTeamSize('201–500')).toBe('201–500 people');
  });

  it('collapses whitespace around the range dash', () => {
    expect(formatTeamSize(' 11 - 50 ')).toBe('11–50 people');
  });

  it('keeps an open-ended label', () => {
    expect(formatTeamSize('500+')).toBe('500+ people');
  });

  it('renders nothing when unset or blank', () => {
    expect(formatTeamSize(null)).toBeUndefined();
    expect(formatTeamSize(undefined)).toBeUndefined();
    expect(formatTeamSize('   ')).toBeUndefined();
  });
});
