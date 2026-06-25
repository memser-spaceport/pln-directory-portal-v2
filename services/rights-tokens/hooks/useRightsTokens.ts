import { useQuery } from '@tanstack/react-query';
import { getCookiesFromClient } from '@/utils/third-party.helper';

// ---------------------------------------------------------------------------
// Types — `GET /api/v1/plaa-tokens`
// ---------------------------------------------------------------------------

export interface PlaaTokensApiResponse {
  id: string;
  memberUid: string;
  uId: string | null;
  aaId: string;
  grossRightsCollected: number;
  grossTokensCollected: number;
  cumulativeTokensSold: number;
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

const EMPTY_BALANCE: RightsTokensBalanceResponse = {
  rights: 0,
  tokens: 0,
  tokensSold: 0,
  totalRightsAndTokens: 0,
  lastUpdated: '',
};

// ---------------------------------------------------------------------------
// Mapper
// ---------------------------------------------------------------------------

function mapPlaaTokensToDashboard(data: PlaaTokensApiResponse): RightsTokensBalanceResponse {
  const rights = Number(data.grossRightsCollected) || 0;
  const tokens = Number(data.grossTokensCollected) || 0;
  const tokensSold = Number(data.cumulativeTokensSold) || 0;

  return {
    rights,
    tokens,
    tokensSold,
    totalRightsAndTokens: rights + tokens,
    lastUpdated: data.updatedAt ?? data.createdAt ?? '',
  };
}

function isPlaaTokensResponse(data: unknown): data is PlaaTokensApiResponse {
  return (
    typeof data === 'object' &&
    data !== null &&
    'grossRightsCollected' in data &&
    'grossTokensCollected' in data
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

    if (res.status === 403) return null;
    if (res.status === 404) return EMPTY_BALANCE;
    if (!res.ok) throw new Error(`Rights-tokens request failed: ${res.status}`);

    const data: unknown = await res.json();
    if (!isPlaaTokensResponse(data)) return EMPTY_BALANCE;

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
