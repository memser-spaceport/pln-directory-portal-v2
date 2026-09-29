import { format, getYear, isToday, isYesterday, subDays, subMonths, subWeeks } from 'date-fns';

import { makeTurn, type Turn } from '../ai-search/AnswerPanel';
import { CHAT_HISTORY_SEED } from '../ai-search/mocks';
import type { AiSearchScope } from '../ai-search/scope';

/** One AI Search conversation. Its title is its first question. */
export interface ChatThread {
  id: number;
  createdAt: Date;
  turns: Turn[];
  /** A thread started "about" a team or person keeps that scope for its follow-ups. */
  scope: AiSearchScope | null;
}

let nextThreadId = 1;
export const newThreadId = () => nextThreadId++;

export const threadTitle = (t: ChatThread) => t.turns[0]?.question ?? 'New chat';

/**
 * Past chats, already answered, newest first. The ai-search entry's own seed
 * (nine threads, today back to last year) so every date group draws, plus two
 * more today and one yesterday, because a page whose job is to hold history
 * should open on a rail that looks used.
 */
const EXTRA_SEED: { questions: string[]; daysAgo: number }[] = [
  { questions: ['Compare Lumen Storage and Saturn Grid'], daysAgo: 0 },
  { questions: ['Who at Lumen Storage offers office hours?'], daysAgo: 0 },
  { questions: ['Upcoming events in Berlin with PL teams attending'], daysAgo: 1 },
];

export function seedThreads(): ChatThread[] {
  return [...EXTRA_SEED, ...CHAT_HISTORY_SEED]
    .map(({ questions, daysAgo }, i) => ({
      id: newThreadId(),
      /* Minutes apart within a day, so "newest first" is stable. */
      createdAt: new Date(subDays(new Date(), daysAgo).getTime() - i * 60_000),
      scope: null,
      turns: questions.map((q) => {
        const t = makeTurn(q);
        return { ...t, shown: t.answer, status: 'done' as const };
      }),
    }))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

/** Short relative label for a row that stands alone (the popover's rows). */
export function whenLabel(d: Date) {
  if (isToday(d)) return 'Today';
  if (isYesterday(d)) return 'Yesterday';
  return format(d, 'MMM d');
}

/**
 * Production's history buckets (`app-sidebar.tsx` → `groupChatsByDate`):
 * Today, Yesterday, Last 7 days, Last 30 days, then a year. One deviation,
 * the same one the ai-search entry makes: production drops a thread older than
 * 30 days *from the current year* (it only files past years), so it is never
 * drawn. Here it goes under the current year.
 */
const FIXED_GROUPS = ['Today', 'Yesterday', 'Last 7 days', 'Last 30 days'];

function historyGroup(d: Date, now: Date): string {
  if (isToday(d)) return 'Today';
  if (isYesterday(d)) return 'Yesterday';
  if (d > subWeeks(now, 1)) return 'Last 7 days';
  if (d > subMonths(now, 1)) return 'Last 30 days';
  return String(getYear(d));
}

export function groupHistory(threads: ChatThread[]): Array<[string, ChatThread[]]> {
  const now = new Date();
  const groups = new Map<string, ChatThread[]>();
  for (const thread of threads) {
    const key = historyGroup(thread.createdAt, now);
    groups.set(key, [...(groups.get(key) ?? []), thread]);
  }
  const years = [...groups.keys()].filter((k) => !FIXED_GROUPS.includes(k)).sort((a, b) => Number(b) - Number(a));
  return [...FIXED_GROUPS, ...years]
    .filter((k) => groups.has(k))
    .map((k) => [k, groups.get(k)!.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())]);
}
