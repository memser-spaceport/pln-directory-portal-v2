import { formatSpvClosesAt } from '@/services/spv-spotlight/formatSpvClosesAt';
import { formatSpvFundingStage } from '@/services/spv-spotlight/formatSpvFundingStage';

describe('formatSpvClosesAt', () => {
  it.each([
    ['2026-10-31T00:00:00.000Z', 'Oct 31, 2026'],
    ['2026-10-31T23:59:59Z', 'Oct 31, 2026'],
    ['2026-10-31', 'Oct 31, 2026'],
  ])('formats %s in UTC as %s', (iso, expected) => {
    expect(formatSpvClosesAt(iso)).toBe(expected);
  });

  it('does not slip a midnight-UTC close to the day before in a US time zone', () => {
    // The local reading is the bug this guards against.
    const local = new Date('2026-10-31T00:00:00.000Z').toLocaleDateString('en-US', {
      timeZone: 'America/Los_Angeles',
      month: 'short',
      day: 'numeric',
    });
    expect(local).toBe('Oct 30');
    expect(formatSpvClosesAt('2026-10-31T00:00:00.000Z')).toBe('Oct 31, 2026');
  });

  it.each([[null], [undefined], [''], ['not-a-date']])('hides the line for %p', (iso) => {
    expect(formatSpvClosesAt(iso)).toBeNull();
  });
});

describe('formatSpvFundingStage', () => {
  it.each([
    ['Pre-seed', 'pre-seed'],
    ['Pre-Seed', 'pre-seed'],
    ['Seed', 'seed'],
    ['Series A', 'Series A'],
    ['series b', 'Series B'],
    [' Series C ', 'Series C'],
  ])('reads %p as %p', (stage, expected) => {
    expect(formatSpvFundingStage(stage)).toBe(expected);
  });

  it.each([[null], [undefined], [''], ['   '], ['Series D and later'], ['Not Applicable'], ['Seed round']])(
    'drops %p',
    (stage) => {
      expect(formatSpvFundingStage(stage)).toBeNull();
    },
  );
});
