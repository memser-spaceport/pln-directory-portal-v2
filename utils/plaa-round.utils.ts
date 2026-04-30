/**
 * PLAA Round ↔ Snapshot Date Mapping Utilities
 *
 * Round 1 = February 2025 (the first monthly snapshot period).
 * Each subsequent round is exactly one calendar month later.
 */

const ROUND_START_YEAR = 2025;
const ROUND_START_MONTH = 2; // 1-indexed: February

interface RoundDateInfo {
  monthName: string;
  monthNumber: number;
  year: number;
  /** Format: "YYYY-MM" – used as the API's snapshotPeriod query parameter */
  snapshotPeriod: string;
  /** Human-readable label, e.g. "April 2026" */
  label: string;
}

/**
 * Returns the calendar month/year for a given PLAA round number.
 */
export function getRoundDateInfo(roundNumber: number): RoundDateInfo {
  // Compute absolute month offset from epoch (year*12 + month-1)
  const absoluteMonth =
    ROUND_START_YEAR * 12 + (ROUND_START_MONTH - 1) + (roundNumber - 1);

  const year = Math.floor(absoluteMonth / 12);
  const monthIndex = absoluteMonth % 12; // 0-indexed
  const monthNumber = monthIndex + 1; // 1-indexed

  const monthName = new Date(year, monthIndex, 1).toLocaleString('en-US', {
    month: 'long',
  });

  const snapshotPeriod = `${year}-${String(monthNumber).padStart(2, '0')}`;

  return { monthName, monthNumber, year, snapshotPeriod, label: `${monthName} ${year}` };
}

/**
 * Returns the last day of the month for a given snapshot period string ("YYYY-MM").
 */
export function getSnapshotLastDay(snapshotPeriod: string): Date {
  const [year, month] = snapshotPeriod.split('-').map(Number);
  return new Date(year, month, 0); // day 0 of next month = last day of current month
}

/**
 * Returns true when today is within the first N days of the current month.
 */
export function isWithinFirstDaysOfMonth(daysThreshold = 5): boolean {
  return new Date().getDate() <= daysThreshold;
}
