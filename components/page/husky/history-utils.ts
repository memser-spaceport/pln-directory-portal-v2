import { getYear, isSameDay, subDays, subMonths, subWeeks } from 'date-fns';

export interface IHistoryThread {
  title: string;
  threadId: string;
  createdAt: string;
  updatedAt: string;
}

const FIXED_GROUPS = ['Today', 'Yesterday', 'Last 7 days', 'Last 30 days'];

// A chat sits under the time it was last used; old chats without an update time fall back to their creation time.
const threadDate = (thread: IHistoryThread) => new Date(thread.updatedAt || thread.createdAt);

const groupLabel = (date: Date, now: Date) => {
  if (isSameDay(date, now)) return 'Today';
  if (isSameDay(date, subDays(now, 1))) return 'Yesterday';
  if (date > subWeeks(now, 1)) return 'Last 7 days';
  if (date > subMonths(now, 1)) return 'Last 30 days';
  return String(getYear(date));
};

/**
 * History groups in display order: Today, Yesterday, Last 7 days, Last 30 days, then one group per year
 * (newest year first). Chats are newest first inside a group; empty groups are left out.
 */
export function groupThreadsByDate<T extends IHistoryThread>(threads: T[], now = new Date()): Array<[string, T[]]> {
  const groups = new Map<string, Array<{ thread: T; time: number }>>();

  for (const thread of threads) {
    const date = threadDate(thread);
    const time = date.getTime();
    if (isNaN(time)) continue;
    const label = groupLabel(date, now);
    const group = groups.get(label);
    if (group) group.push({ thread, time });
    else groups.set(label, [{ thread, time }]);
  }

  const years = Array.from(groups.keys())
    .filter((label) => !FIXED_GROUPS.includes(label))
    .sort((a, b) => Number(b) - Number(a));

  return [...FIXED_GROUPS, ...years]
    .filter((label) => groups.has(label))
    .map((label) => [
      label,
      groups
        .get(label)!
        .sort((a, b) => b.time - a.time)
        .map(({ thread }) => thread),
    ]);
}

/** Chats whose title contains the query, ignoring letter case; every chat for an empty query. */
export function filterThreadsByTitle<T extends IHistoryThread>(threads: T[], query: string): T[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return threads;
  return threads.filter((thread) => (thread.title ?? '').toLowerCase().includes(needle));
}
