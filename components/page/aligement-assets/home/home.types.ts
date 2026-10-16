import type { PlaaSummaryRound, PlaaSummaryTrust } from '@/services/plaa/summary.service';

export interface PlaaHomeData {
  readonly round: PlaaSummaryRound;
  readonly trust?: PlaaSummaryTrust;
}

export type PlaaHomeVariant = 'prospect' | 'member';

export interface PlaaHomeProps extends PlaaHomeData {
  readonly variant: PlaaHomeVariant;
}

export function formatNumber(value: number): string {
  return value.toLocaleString('en-US');
}
