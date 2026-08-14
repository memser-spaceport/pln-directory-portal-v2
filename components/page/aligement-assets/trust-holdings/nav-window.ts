import { NavPoint } from '@/services/plaa/trust-holdings.service';

export const MONTHLY_WINDOW = 12;

// Trailing window ending at the latest point, not a fixed calendar date, so
// it advances on its own as new months are published. Points arrive
// oldest-first and are sliced as-is, no re-sort.
export function takeRecentMonths(points: NavPoint[] | undefined, count: number = MONTHLY_WINDOW): NavPoint[] {
  if (!points?.length) return [];
  if (count <= 0) return [];
  return points.slice(-count);
}
