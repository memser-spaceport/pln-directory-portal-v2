import {
  deriveLogLevel,
  formatLogTimestamp,
  logTimestampSortValue,
  stripCriLogPrefix,
  stripLogControlSequences,
} from '@/services/ai-apps/ai-apps-logs.utils';

describe('deriveLogLevel', () => {
  it.each([
    ['ERROR: build failed', 'error'],
    ['npm ERR! fatal: not a git repository', 'error'],
    ['Unhandled exception in worker', 'error'],
    ['panic: runtime error', 'error'],
    ['warning: deprecated API', 'warn'],
    ['WARN memory usage high', 'warn'],
  ] as const)('flags %j as %s', (message, level) => {
    expect(deriveLogLevel(message)).toBe(level);
  });

  it.each([
    'compiled with 0 errors', // plural — whole-word match must not fire
    'no warnings emitted',
    'transferring context',
    'stderr attached', // "err" inside a word
  ])('leaves %j unmarked', (message) => {
    expect(deriveLogLevel(message)).toBeNull();
  });

  it('prefers error over warn when a line contains both', () => {
    expect(deriveLogLevel('warning escalated to error')).toBe('error');
  });
});

describe('formatLogTimestamp', () => {
  it('formats epoch milliseconds as local "MMM d HH:mm:ss"', () => {
    expect(formatLogTimestamp(Date.UTC(2026, 6, 23, 12, 0, 5))).toMatch(/^[A-Z][a-z]{2} \d{1,2} \d{2}:\d{2}:\d{2}$/);
  });

  it('formats a parseable ISO string', () => {
    expect(formatLogTimestamp('2026-07-23T12:00:05Z')).toMatch(/^[A-Z][a-z]{2} \d{1,2} \d{2}:\d{2}:\d{2}$/);
  });

  it.each([
    [NaN, 'NaN'],
    ['not a date', 'not a date'],
    [null, ''],
    [undefined, ''],
  ])('renders the raw value for unparseable input %j — never "Invalid Date"', (input, expected) => {
    expect(formatLogTimestamp(input)).toBe(expected);
  });
});

describe('stripLogControlSequences', () => {
  it('removes ANSI color and cursor sequences', () => {
    expect(stripLogControlSequences('\u001B[31mERROR\u001B[0m done \u001B[2K')).toBe('ERROR done ');
  });

  it('removes C0 controls and DEL but keeps tabs', () => {
    expect(stripLogControlSequences('a\u0007b\tc\u007Fd')).toBe('ab\tcd');
  });

  it('removes bidi and zero-width characters that can spoof copied text', () => {
    expect(stripLogControlSequences('safe\u202Egnp.exe\u200B')).toBe('safegnp.exe');
  });

  it('leaves ordinary text untouched', () => {
    expect(stripLogControlSequences('Step 1/5 : FROM node:20')).toBe('Step 1/5 : FROM node:20');
  });
});

describe('logTimestampSortValue', () => {
  it.each([
    [1784791854487, 1784791854487],
    ['2026-07-23T07:30:54.000Z', Date.parse('2026-07-23T07:30:54.000Z')],
    ['1784791854487', 1784791854487],
    ['not a date', 0],
    [NaN, 0],
    [null, 0],
    [undefined, 0],
  ])('maps %j to %d', (input, expected) => {
    expect(logTimestampSortValue(input)).toBe(expected);
  });
});

describe('stripCriLogPrefix', () => {
  it('removes the Kubernetes CRI framing (timestamp, stream, tag)', () => {
    expect(stripCriLogPrefix('2026-07-23T14:24:23.877622179Z stdout F Server listening at http://127.0.0.1:3001')).toBe(
      'Server listening at http://127.0.0.1:3001',
    );
    expect(stripCriLogPrefix('2026-07-23T14:24:23.037076488Z stderr P partial line')).toBe('partial line');
  });

  it('leaves lines without the exact framing untouched', () => {
    expect(stripCriLogPrefix('Step 1/5 : FROM node:20')).toBe('Step 1/5 : FROM node:20');
    expect(stripCriLogPrefix('2026-07-23 something stdout-ish')).toBe('2026-07-23 something stdout-ish');
    expect(stripCriLogPrefix('stdout F no leading timestamp')).toBe('stdout F no leading timestamp');
  });
});
