import { plaaApiHeaders } from '@/services/plaa/plaa-api';
import type { DonutSlice } from '@/services/plaa/trust-holdings.service';
import { TRUST_HOLDINGS_CACHE_TAG } from '@/services/plaa/trust-holdings.service';
import type { RoundStatsChartEntry } from '@/services/plaa/rounds.service';

export interface PlaaSummaryRound {
  roundNumber: number;
  period: string;
  month: string;
  year: number;
  onboardedParticipants: number;
  chart: RoundStatsChartEntry[];
}

export interface PlaaSummaryNavPoint {
  label: string;
  date: string;
  nav: number;
}

export interface PlaaSummaryTrust {
  navPerPlaaHeadline: string;
  asOfDate: string;
  trustTotalValue: string;
  portfolioCompanies: number;
  navHistory: PlaaSummaryNavPoint[];
  focusAreas: DonutSlice[];
  trustComposition: DonutSlice[];
}

export interface PlaaSummary {
  round: PlaaSummaryRound;
  trust: PlaaSummaryTrust | null;
}

export const getPlaaSummary = async (): Promise<{ data?: PlaaSummary; error?: { message: string } }> => {
  if (!process.env.PLAA_API_URL) {
    return { error: { message: 'PLAA_API_URL is not configured' } };
  }

  try {
    const response = await fetch(`${process.env.PLAA_API_URL}/api/v1/summary`, {
      method: 'GET',
      headers: plaaApiHeaders(),
      next: { revalidate: 300, tags: [TRUST_HOLDINGS_CACHE_TAG] },
    });

    if (!response.ok) {
      return { error: { message: `API responded with ${response.status}: ${response.statusText}` } };
    }

    const data: PlaaSummary = await response.json();
    return { data };
  } catch (error) {
    console.error('[summary.service] Failed to fetch PLAA summary:', error);
    return { error: { message: 'Failed to fetch PLAA summary' } };
  }
};
