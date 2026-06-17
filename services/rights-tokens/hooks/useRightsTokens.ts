import { useQuery } from '@tanstack/react-query';
import { getCookiesFromClient } from '@/utils/third-party.helper';

// ---------------------------------------------------------------------------
// Types — `GET /api/v1/plaa-tokens`
// ---------------------------------------------------------------------------

export interface PlaaTokensApiResponse {
  id: string;
  memberUid: string;
  aaId: string;
  tokenSettlementElectionStatus: string;
  tokenSettlementElectionDate: string;
  grossTokensCollected: number;
  grossTokensEntitledToUponSettlement: number;
  tokensCurrentlySettledToYou: number;
  cumulativeTokensSoldDuringBuybacks: number;
  createdAt: string;
  updatedAt: string;
}

export interface RightsTokensBalanceResponse {
  rights: number;
  tokens: number;
  tokensSold: number;
  totalRightsAndTokens: number;
  lastUpdated: string;
}

export const RightsTokensQueryKeys = {
  BALANCE: 'rights-tokens-balance',
} as const;

// ---------------------------------------------------------------------------
// Mapper
// ---------------------------------------------------------------------------

function mapPlaaTokensToDashboard(data: PlaaTokensApiResponse): RightsTokensBalanceResponse {
  const tokens = Number(data.tokensCurrentlySettledToYou) || 0;
  const entitled = Number(data.grossTokensEntitledToUponSettlement) || 0;
  const rights = Math.max(0, entitled - tokens);
  const tokensSold = Number(data.cumulativeTokensSoldDuringBuybacks) || 0;

  return {
    rights,
    tokens,
    tokensSold,
    totalRightsAndTokens: rights + tokens,
    lastUpdated: data.updatedAt ?? data.createdAt,
  };
}

function isPlaaTokensResponse(data: unknown): data is PlaaTokensApiResponse {
  return (
    typeof data === 'object' &&
    data !== null &&
    'grossTokensEntitledToUponSettlement' in data &&
    'tokensCurrentlySettledToYou' in data
  );
}

// ---------------------------------------------------------------------------
// Fetcher
// ---------------------------------------------------------------------------

async function fetchRightsTokensBalance(): Promise<RightsTokensBalanceResponse | null> {
  const { authToken } = getCookiesFromClient();
  if (!authToken) return null;

  try {
    const res = await fetch('/api/plaa/plaa-tokens', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
    });

    if (res.status === 403 || res.status === 404) return null;
    if (!res.ok) throw new Error(`Rights-tokens request failed: ${res.status}`);

    const data: unknown = await res.json();
    if (!isPlaaTokensResponse(data)) return null;

    return mapPlaaTokensToDashboard(data);
  } catch (error) {
    console.error('fetchRightsTokensBalance error:', error);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/** Fetches the user's rights & token balances from `GET /api/v1/plaa-tokens`. */
export function useRightsTokensBalance() {
  return useQuery<RightsTokensBalanceResponse | null>({
    queryKey: [RightsTokensQueryKeys.BALANCE],
    queryFn: fetchRightsTokensBalance,
    staleTime: 2 * 60 * 1000,
    retry: 1,
  });
}
