import { relativeAge } from '@/components/page/aligement-assets/feedback/feedback.utils';

const NOW = Date.parse('2026-11-23T12:00:00Z');
const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const ago = (elapsed: number) => relativeAge(new Date(NOW - elapsed).toISOString(), NOW);

describe('how old a row says it is', () => {
  it.each([
    [30 * SECOND, 'just now'],
    [59 * SECOND, 'just now'],
    [5 * MINUTE, '5m ago'],
    [59 * MINUTE, '59m ago'],
    [3 * HOUR, '3h ago'],
    [23 * HOUR, '23h ago'],
    [2 * DAY, '2d ago'],
    [29 * DAY, '29d ago'],
  ])('%d ms reads as %s', (elapsed, expected) => {
    expect(ago(elapsed)).toBe(expected);
  });

  it('gives the date, with its year, once a row is a month old', () => {
    expect(ago(45 * DAY)).toMatch(/2026/);
  });

  it('says nothing for a date it cannot read', () => {
    expect(relativeAge('not a date', NOW)).toBe('');
  });
});
