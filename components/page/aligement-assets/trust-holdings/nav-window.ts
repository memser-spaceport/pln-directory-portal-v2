import { NavPoint } from '@/services/plaa/trust-holdings.service';

/** How many months the Monthly Graph shows. */
export const MONTHLY_WINDOW = 12;

/**
 * Rolling window of the most recent `count` points, ending at the latest point
 * in the series rather than at a fixed calendar date — so the window advances
 * on its own as the backend publishes new months.
 *
 * Order is taken from the API response, which returns points oldest-first;
 * that is the same ordering the table and the chart already render in, so the
 * window deliberately does not re-sort. Series shorter than the window are
 * returned whole rather than padded with empty months.
 */
export function takeRecentMonths(points: NavPoint[] | undefined, count: number = MONTHLY_WINDOW): NavPoint[] {
  if (!points?.length) return [];
  if (count <= 0) return [];
  return points.slice(-count);
}
