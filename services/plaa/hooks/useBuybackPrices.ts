import { useQuery } from '@tanstack/react-query';
import { hasSession } from '@/utils/third-party.helper';
import { customFetch } from '@/utils/fetch-wrapper';

export interface BuybackPrice {
  roundNumber: number;
  auctionNumber: number | null;
  clearingPrice: number;
}

export const BuybackPricesQueryKeys = {
  PRICES: 'buyback-clearing-prices',
} as const;

async function fetchBuybackPrices(): Promise<BuybackPrice[] | null> {
  if (!hasSession()) return null;

  const res = await customFetch('/api/plaa/buyback-prices', { method: 'GET', headers: {} }, true);
  if (!res || res.status === 401 || res.status === 403) return null;
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
