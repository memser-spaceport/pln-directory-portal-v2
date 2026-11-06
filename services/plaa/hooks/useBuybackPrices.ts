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

  try {
    const res = await fetch('/api/plaa/buyback-prices', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
    });

    if (res.status === 401 || res.status === 403) return null;
    if (!res.ok) throw new Error(`Buyback prices request failed: ${res.status}`);

    return res.json();
  } catch (error) {
    console.error('fetchBuybackPrices error:', error);
    return null;
  }
}

/** Prices change only when an auction closes, so this is cached longer than live figures. */
export function useBuybackPrices() {
  return useQuery<BuybackPrice[] | null>({
    queryKey: [BuybackPricesQueryKeys.PRICES],
    queryFn: fetchBuybackPrices,
    staleTime: 10 * 60 * 1000,
    retry: 1,
  });
}
