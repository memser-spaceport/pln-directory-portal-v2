import { FeedbackStatus, STATUS_LABELS, VOTABLE_STATUSES } from '@/services/plaa/feedback/feedback.types';

export function isFeedbackBoardEnabled(): boolean {
  return process.env.NEXT_PUBLIC_PLAA_FEEDBACK_BOARD === 'true';
}

export const GOOGLE_FORM_URL = 'https://forms.gle/NAKxJ8RUqmUf9fmQ9';

export function feedbackNavTarget(): { url: string; isExternal: boolean } {
  return isFeedbackBoardEnabled()
    ? { url: '/alignment-asset/feedback', isExternal: false }
    : { url: GOOGLE_FORM_URL, isExternal: true };
}

export function canVote(status: FeedbackStatus): boolean {
  return VOTABLE_STATUSES.includes(status);
}

export function voteDisabledReason(status: FeedbackStatus): string {
  if (status === 'completed') return 'This one shipped — voting is closed.';
  if (status === 'declined') return "This one won't be built — voting is closed.";
  if (status === 'duplicate') return 'Merged into another item — vote there instead.';
  return '';
}

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

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

export function lastMoveLine(status: FeedbackStatus, statusChangedAt: string): string {
  return `Moved to ${STATUS_LABELS[status]} · ${formatDate(statusChangedAt)}`;
}
