import { useQuery } from '@tanstack/react-query';
import { getCookiesFromClient } from '@/utils/third-party.helper';

export interface RedemptionHistoryEntry {
  auctionNumber: number | null;
  plaaRedeemed: number | null;
  roundNumber: number | null;
  /** Calendar month the auction closed in, resolved server-side. Null when unresolvable. */
  period: string | null;
}

export const RedemptionHistoryQueryKeys = {
  REDEMPTIONS: 'profile-redemption-history',
} as const;

async function fetchRedemptionHistory(): Promise<RedemptionHistoryEntry[] | null> {
  const { authToken } = getCookiesFromClient();
  if (!authToken) return null;

  try {
    const res = await fetch('/api/plaa/redemptions', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
    });

    if (res.status === 401 || res.status === 403) return null;
    if (!res.ok) throw new Error(`Redemption history request failed: ${res.status}`);

    return res.json();
  } catch (error) {
    console.error('fetchRedemptionHistory error:', error);
    return null;
  }
}

export function useRedemptionHistory() {
  return useQuery<RedemptionHistoryEntry[] | null>({
    queryKey: [RedemptionHistoryQueryKeys.REDEMPTIONS],
    queryFn: fetchRedemptionHistory,
    staleTime: 2 * 60 * 1000,
    retry: 1,
  });
}
