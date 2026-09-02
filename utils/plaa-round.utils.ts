// Round 1 = February 2025; each subsequent round is one calendar month later.
const ROUND_START_YEAR = 2025;
const ROUND_START_MONTH = 2; // 1-indexed: February

interface RoundDateInfo {
  monthName: string;
  monthNumber: number;
  year: number;
  /** "YYYY-MM", used as the API's snapshotPeriod query parameter. */
  snapshotPeriod: string;
  label: string;
}

export function getRoundDateInfo(roundNumber: number): RoundDateInfo {
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

export function getCurrentRoundNumber(): number {
  const now = new Date();
  const absoluteMonth = now.getFullYear() * 12 + now.getMonth();
  const epochMonth = ROUND_START_YEAR * 12 + (ROUND_START_MONTH - 1);
  return absoluteMonth - epochMonth + 1;
}

export function getSnapshotLastDay(snapshotPeriod: string): Date {
  const [year, month] = snapshotPeriod.split('-').map(Number);
  return new Date(year, month, 0); // day 0 of next month = last day of current month
}

export function isWithinFirstDaysOfMonth(daysThreshold = 5): boolean {
  return new Date().getDate() <= daysThreshold;
}

/** Same derivation as app/alignment-asset/page.tsx's mergeRoundStats, for snapshotProgress. */
export function getSnapshotDatesFromPeriod(period: string): { startDate: Date; endDate: Date } {
  const [year, month] = period.split('-').map(Number);
  const lastDayOfMonth = new Date(year, month, 0).getDate();
  const startDate = new Date(year, month - 1, 1, 0, 0, 0);
  const endDate = new Date(year, month - 1, lastDayOfMonth, 23, 59, 59);
  return { startDate, endDate };
}

export interface SnapshotProgress {
  /** 0-100, rounded to 2 decimal places. */
  progressPercentage: number;
  /** Inclusive of today; 0 once the period has ended. */
  remainingDays: number;
  timeRemainingLabel: string;
  dateRangeLabel: string;
}

/** Shared by SnapshotProgressSection and useCurrentSnapshotStatus so both use the same formula. */
export function getSnapshotProgress(startDate: Date, endDate: Date, now: Date = new Date()): SnapshotProgress {
  const start = new Date(startDate);
  const end = new Date(endDate);

  const totalDuration = end.getTime() - start.getTime();
  const elapsedTime = now.getTime() - start.getTime();

  let percentage: number;
  if (now < start) {
    percentage = 0;
  } else if (now > end) {
    percentage = 100;
  } else {
    percentage = Math.min(100, Math.max(0, (elapsedTime / totalDuration) * 100));
  }

  const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endDateOnly = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  const remainingDays = Math.max(0, Math.floor((endDateOnly.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24)) + 1);

  let timeRemainingLabel: string;
  if (now > end) {
    timeRemainingLabel = 'Snapshot period has ended';
  } else if (now < start) {
    timeRemainingLabel = 'Snapshot period has not started yet';
  } else if (remainingDays === 1) {
    timeRemainingLabel = '1 day remaining in current snapshot period';
  } else {
    timeRemainingLabel = `${remainingDays} days remaining in current snapshot period`;
  }

  const formatDate = (date: Date) => date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const startMonth = start.toLocaleDateString('en-US', { month: 'long' });
  const startDay = start.getDate();
  const endDay = end.getDate();
  const year = end.getFullYear();
  const isSameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();
  const dateRangeLabel = isSameMonth
    ? `${startMonth} ${startDay}-${endDay}, ${year}`
    : `${formatDate(start)} - ${formatDate(end)}`;

  return {
    progressPercentage: Math.round(percentage * 100) / 100,
    remainingDays,
    timeRemainingLabel,
    dateRangeLabel,
  };
}
