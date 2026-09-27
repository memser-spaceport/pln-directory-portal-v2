import type { TrustHoldingsData } from '@/services/plaa/trust-holdings.service';
import type { RoundStatsResponse } from '@/services/plaa/rounds.service';

/**
 * Everything the home page renders is derived from these two live payloads.
 * Nothing on the home page is allowed to carry a literal figure: if a value is
 * not in here it is not shown (see REPORT-homepage.md for the omitted items).
 */
export interface PlaaHomeData {
  readonly round: RoundStatsResponse;
  readonly trust?: TrustHoldingsData;
}

/**
 * The design serves one marketing home to both personas and varies only the
 * calls to action and one heading:
 *   showProspect: view === 'home' && (!onboarded || persona === 'active')
 * `prospect` = not onboarded, `member` = onboarded.
 */
export type PlaaHomeVariant = 'prospect' | 'member';

export interface PlaaHomeProps extends PlaaHomeData {
  readonly variant: PlaaHomeVariant;
  /** Member display name, used for the signed-in greeting. */
  readonly memberName?: string;
}

/** Last calendar day of the round's month — the snapshot close. */
export function getRoundCloseDate(period: string): Date {
  const [year, month] = period.split('-').map(Number);
  return new Date(year, month, 0, 23, 59, 59);
}

export function formatLongDate(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

/** Whole days between now and the snapshot close; never negative. */
export function getDaysRemaining(close: Date, now: Date = new Date()): number {
  const ms = close.getTime() - now.getTime();
  return Math.max(0, Math.ceil(ms / 86_400_000));
}

export function formatNumber(value: number): string {
  return value.toLocaleString('en-US');
}
