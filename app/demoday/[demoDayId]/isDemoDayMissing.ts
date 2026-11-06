import type { getDemoDayState } from '@/app/actions/demo-day.actions';

/**
 * True only when the API says the Demo Day does not exist (404). The public Demo Day pages answer that with a 404 of
 * their own (LAB-2930); any other failure (an outage, a 5xx) is not a reason to tell crawlers the page is gone.
 */
export function isDemoDayMissing(result: Awaited<ReturnType<typeof getDemoDayState>> | null | undefined): boolean {
  return !!result && 'isError' in result && result.status === 404;
}
