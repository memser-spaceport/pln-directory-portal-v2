import { formatDistanceToNow } from 'date-fns';

/**
 * Abbreviated relative time, e.g. "3min ago", "5h ago", "3 weeks ago".
 *
 * Returns '' (so callers can omit the clause) for: null/undefined/empty input,
 * an unparseable date (`new Date('x')` is Invalid Date — it does NOT throw, so
 * the try/catch alone wouldn't catch it), and future dates (clock skew / bad
 * data must never render "in 3 weeks ago").
 */
export function formatTimeAgo(date: string | number | null | undefined): string {
  if (date == null || date === '') return '';
  const d = new Date(date);
  const t = d.getTime();
  if (Number.isNaN(t)) return '';
  if (t > Date.now()) return '';
  try {
    return (
      formatDistanceToNow(d, { addSuffix: false })
        .replace('about ', '')
        .replace('less than a minute', '1min')
        .replace(' minutes', 'min')
        .replace(' minute', 'min')
        .replace(' hours', 'h')
        .replace(' hour', 'h')
        .replace(' days', 'd')
        .replace(' day', 'd') + ' ago'
    );
  } catch {
    return '';
  }
}
