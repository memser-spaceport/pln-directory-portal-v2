import { formatAiAppDate, formatCount } from '@/utils/ai-apps.utils';

describe('formatCount', () => {
  it('leaves anything under a thousand as a plain number', () => {
    expect(formatCount(0)).toBe('0');
    expect(formatCount(7)).toBe('7');
    expect(formatCount(999)).toBe('999');
  });
  it('uses one decimal k for thousands under 10k', () => {
    expect(formatCount(1000)).toBe('1k');
    expect(formatCount(1240)).toBe('1.2k');
  });

  it('rounds whole k at 10k and above', () => {
    expect(formatCount(12_500)).toBe('13k');
  });
});

describe('formatAiAppDate', () => {
  it('formats an ISO date in en-US short form', () => {
    expect(formatAiAppDate('2026-08-15T12:00:00.000Z')).toMatch(/Aug 15, 2026/);
  });
});
