/**
 * Relative time from a fixed offset, in production `formatTimeAgo`'s vocabulary
 * ("3min ago", "5h ago", "3 weeks ago"). Same helper the ai-apps mocks carry —
 * local, because the real one reads `Date.now()` and a server-rendered route
 * can't do that without tearing on hydration.
 */
export function formatMinutesAgo(minutes: number): string {
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${Math.round(minutes)}min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(minutes / 60 / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.round(days / 7);
  if (weeks < 5) return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
  const months = Math.round(days / 30);
  return `${months} ${months === 1 ? 'month' : 'months'} ago`;
}
