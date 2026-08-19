// Cache tag for this fetch, used by /api/revalidate.
export const TRUST_HOLDINGS_CACHE_TAG = 'trust-holdings';

export interface NavPoint {
  label: string;
  date: string;
  totalPlaa: number;
  nav: number;
  navPerPlaa: number;
  treasuries: number;
  btc: number;
  eth: number;
  fil: number;
  plvh: number;
}

export interface BuybackMetric {
  label: string;
  value: string;
}

export interface DonutSlice {
  name: string;
  value: number;
  color: string;
  description?: string;
  amount?: string;
}

export interface TrustHoldingsData {
  navPerPlaaHeadline: string;
  asOfDate: string;
  trustTotalValue: string;
  portfolioCompanies: number;
  quarterly: NavPoint[];
  monthly: NavPoint[];
  buybackMetrics: BuybackMetric[];
  focusAreas: DonutSlice[];
  trustComposition: DonutSlice[];
  disclaimers: string[];
}

export const getTrustHoldings = async (): Promise<{ data?: TrustHoldingsData; error?: { message: string } }> => {
  try {
    const url = `${process.env.PLAA_API_URL}/api/v1/trust-holdings`;
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      next: { revalidate: 300, tags: [TRUST_HOLDINGS_CACHE_TAG] },
    });

    if (!response.ok) {
      return { error: { message: `API responded with ${response.status}: ${response.statusText}` } };
    }

    const data: TrustHoldingsData = await response.json();
    return { data };
  } catch (error) {
    console.error('[trust-holdings.service] Failed to fetch trust & holdings data:', error);
    return { error: { message: 'Failed to fetch trust & holdings data' } };
  }
};
