import { formatInTimeZone } from 'date-fns-tz';

/**
 * The close date as "Oct 31, 2026", in UTC: admins pick a calendar day, so a
 * midnight-UTC close must not read as the day before in US time zones.
 *
 * Null (hide the line) when there is no date or it doesn't parse: a raw
 * timestamp is worse than no date. A date in the past still shows while the
 * spotlight is OPEN, on purpose: the status, not the date, closes a Spotlight.
 */
export function formatSpvClosesAt(iso?: string | null): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return formatInTimeZone(date, 'UTC', 'MMM d, yyyy');
}
