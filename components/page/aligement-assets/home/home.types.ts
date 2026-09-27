import type { TrustHoldingsData } from '@/services/plaa/trust-holdings.service';
import type { RoundStatsResponse } from '@/services/plaa/rounds.service';

export interface PlaaHomeData {
  readonly round: RoundStatsResponse;
  readonly trust?: TrustHoldingsData;
}

export type PlaaHomeVariant = 'prospect' | 'member';

export interface PlaaHomeProps extends PlaaHomeData {
  readonly variant: PlaaHomeVariant;
  readonly memberName?: string;
}

export function getRoundCloseDate(period: string): Date {
  const [year, month] = period.split('-').map(Number);
  return new Date(year, month, 0, 23, 59, 59);
}

export function formatLongDate(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

export function getDaysRemaining(close: Date, now: Date = new Date()): number {
  const ms = close.getTime() - now.getTime();
  return Math.max(0, Math.ceil(ms / 86_400_000));
}

export function formatNumber(value: number): string {
  return value.toLocaleString('en-US');
}
