import { useQuery } from '@tanstack/react-query';
import { getCookiesFromClient } from '@/utils/third-party.helper';

export interface BuybackPrice {
  roundNumber: number;
  auctionNumber: number | null;
  clearingPrice: number;
}

export const BuybackPricesQueryKeys = {
  PRICES: 'buyback-clearing-prices',
} as const;

async function fetchBuybackPrices(): Promise<BuybackPrice[] | null> {
  const { authToken } = getCookiesFromClient();
  if (!authToken) return null;

  const res = await fetch('/api/plaa/buyback-prices', {
    method: 'GET',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
  });
  if (res.status === 401 || res.status === 403) return null;
  if (!res.ok) throw new Error(`Buyback prices request failed: ${res.status}`);
  return res.json();
}

export function useBuybackPrices(memberKey: string | null) {
  return useQuery<BuybackPrice[] | null>({
    queryKey: [BuybackPricesQueryKeys.PRICES, memberKey],
    enabled: memberKey !== null,
    queryFn: fetchBuybackPrices,
    staleTime: 10 * 60 * 1000,
    retry: 1,
  });
}
