import { getYear, isToday, isYesterday, subMonths, subWeeks } from 'date-fns';

import type { IHistoryThread } from '../types/historyThread';

const RECENT_GROUPS = ['Today', 'Yesterday', 'Last 7 days', 'Last 30 days'];

function groupLabel(date: Date, now: Date) {
  if (isToday(date)) {
    return 'Today';
  }
  if (isYesterday(date)) {
    return 'Yesterday';
  }
  if (date > subWeeks(now, 1)) {
    return 'Last 7 days';
  }
  if (date > subMonths(now, 1)) {
    return 'Last 30 days';
  }
  return String(getYear(date));
}

// Recent groups first, then years newest first; threads newest first inside each group.
export function groupThreadsByDate(threads: IHistoryThread[]): Array<[string, IHistoryThread[]]> {
  const now = new Date();
  const groups = new Map<string, IHistoryThread[]>();
  for (const thread of threads) {
    const date = new Date(thread.createdAt);
    if (isNaN(date.getTime())) {
      continue;
    }
    const label = groupLabel(date, now);
    groups.set(label, [...(groups.get(label) ?? []), thread]);
  }

  const years = [...groups.keys()]
    .filter((label) => !RECENT_GROUPS.includes(label))
    .sort((a, b) => Number(b) - Number(a));
  return [...RECENT_GROUPS, ...years]
    .filter((label) => groups.has(label))
    .map((label) => [
      label,
      groups.get(label)!.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    ]);
}
