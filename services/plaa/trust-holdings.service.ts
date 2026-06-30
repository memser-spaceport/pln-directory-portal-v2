export interface TrustHoldingsNavPoint {
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
  estimated: boolean;
}

export interface TrustHoldingsBuybackMetric {
  label: string;
  value: string;
}

export interface TrustHoldingsDonutSlice {
  name: string;
  value: number;
  color: string;
  description?: string;
  amount?: string;
}

export interface TrustHoldingsApiResponse {
  navPerPlaaHeadline: string;
  trustTotalValue: string;
  portfolioCompanies: number;
  quarterly: TrustHoldingsNavPoint[];
  monthly: TrustHoldingsNavPoint[];
  buybackMetrics: TrustHoldingsBuybackMetric[];
  focusAreas: TrustHoldingsDonutSlice[];
  trustComposition: TrustHoldingsDonutSlice[];
  disclaimers: string[];
}

export const getTrustHoldings = async (): Promise<{ data?: TrustHoldingsApiResponse; error?: { message: string } }> => {
  try {
    const baseUrl = process.env.PLAA_API_URL;

    if (!baseUrl) {
      return { error: { message: 'PLAA_API_URL is not configured' } };
    }

    const response = await fetch(`${baseUrl}/api/v1/trust-holdings`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      return { error: { message: `API responded with ${response.status}: ${response.statusText}` } };
    }

    const data: TrustHoldingsApiResponse = await response.json();
    return { data };
  } catch (error) {
    console.error('[trust-holdings.service] Failed to fetch trust holdings:', error);
    return { error: { message: 'Failed to fetch trust holdings data' } };
  }
};
