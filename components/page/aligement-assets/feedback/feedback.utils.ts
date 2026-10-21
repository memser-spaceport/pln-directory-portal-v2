import { FeedbackStatus, STATUS_LABELS, VOTABLE_STATUSES } from '@/services/plaa/feedback/feedback.types';

/**
 * Feature flag `plaaFeedbackBoard` (§7 T-8). Off unless the env var is exactly
 * 'true', so an unset or malformed value keeps the Google Form.
 *
 * Read through a function rather than a module constant so tests can flip it.
 */
export function isFeedbackBoardEnabled(): boolean {
  return process.env.NEXT_PUBLIC_PLAA_FEEDBACK_BOARD === 'true';
}

export const GOOGLE_FORM_URL = 'https://forms.gle/NAKxJ8RUqmUf9fmQ9';

/** Where the nav's Feedback entry points, per the flag. */
export function feedbackNavTarget(): { url: string; isExternal: boolean } {
  return isFeedbackBoardEnabled()
    ? { url: '/alignment-asset/feedback', isExternal: false }
    : { url: GOOGLE_FORM_URL, isExternal: true };
}

export function canVote(status: FeedbackStatus): boolean {
  return VOTABLE_STATUSES.includes(status);
}

/** "Voting is closed" needs a reason the reader can act on. */
export function voteDisabledReason(status: FeedbackStatus): string {
  if (status === 'completed') return 'This one shipped — voting is closed.';
  if (status === 'declined') return "This one won't be built — voting is closed.";
  if (status === 'duplicate') return 'Merged into another item — vote there instead.';
  return '';
}

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** Short relative age: "3d", "2h", "just now". */
export function relativeAge(iso: string, now: number = Date.now()): string {
  const elapsed = now - new Date(iso).getTime();
  if (Number.isNaN(elapsed)) return '';
  if (elapsed < MINUTE) return 'just now';
  if (elapsed < HOUR) return `${Math.floor(elapsed / MINUTE)}m ago`;
  if (elapsed < DAY) return `${Math.floor(elapsed / HOUR)}h ago`;
  if (elapsed < 30 * DAY) return `${Math.floor(elapsed / DAY)}d ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function formatMonth(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

/** Card footer line: "Moved to In Progress · Oct 21" (§2). */
export function lastMoveLine(status: FeedbackStatus, statusChangedAt: string): string {
  return `Moved to ${STATUS_LABELS[status]} · ${formatDate(statusChangedAt)}`;
}

/** Completed items grouped newest month first, for the Completed tab (F-6). */
export function groupByMonth<T extends { completed_at: string | null }>(items: T[]): [string, T[]][] {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    if (!item.completed_at) continue;
    const key = formatMonth(item.completed_at);
    groups.set(key, [...(groups.get(key) ?? []), item]);
  }
  return [...groups.entries()];
}
