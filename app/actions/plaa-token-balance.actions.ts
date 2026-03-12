'use server';

import { TokenDashboardData } from '@/components/page/aligement-assets/rounds/types';

interface TokenBalanceResponse {
  data?: TokenDashboardData;
  isError?: boolean;
  error?: { status: number; statusText: string };
}

/**
 * Fetches the authenticated user's PLAA token balance.
 * TODO: Replace stubbed response with actual API call once endpoint is available.
 */
export const getTokenBalance = async (): Promise<TokenBalanceResponse> => {
  try {
    // TODO: Uncomment and use when the real API endpoint is ready
    // const response = await fetch(
    //   `${process.env.PLAA_API_URL}/api/v1/plaa-tokens`,
    //   {
    //     method: 'GET',
    //     cache: 'no-store',
    //     headers: getHeader(authToken ?? ''),
    //   },
    // );
    //
    // if (!response.ok) {
    //   return { isError: true, error: { status: response.status, statusText: response.statusText } };
    // }
    //
    // const data: TokenDashboardData = await response.json();
    // return { data };

    await new Promise((resolve) => setTimeout(resolve, 800));

    return {
      data: {
        totalTokens: 12000,
        tokenName: 'PLAA1 Tokens',
        entitledTokens: 12000,
        settledTokens: 0,
        soldTokens: 500,
        settlementElectionStatus: 'In progress',
        electedOn: '3 March 2026',
        lastUpdated: 'FEB 25, 2026 • 10:42 AM MT',
      },
    };
  } catch {
    return {
      isError: true,
      error: { status: 500, statusText: 'Failed to fetch token balance' },
    };
  }
};
