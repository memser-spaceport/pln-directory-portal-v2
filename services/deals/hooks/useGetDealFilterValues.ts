import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { IDealFilterValues } from '@/types/deals.types';
import { getAllDeals } from '../deals.service';
import { DealsQueryKeys, DEAL_CATEGORY_LABELS, DEAL_AUDIENCE_LABELS, REQUIRED_AUDIENCES } from '../constants';

export function useGetDealFilterValues() {
  const { data: allDeals, isLoading, isError } = useQuery({
    queryKey: [DealsQueryKeys.DEALS_LIST],
    queryFn: getAllDeals,
    staleTime: 60000,
    gcTime: 120000,
  });

  const data: IDealFilterValues | undefined = useMemo(() => {
    if (!allDeals) return undefined;

    const categoryMap = new Map<string, number>();
    const audienceMap = new Map<string, number>();
    allDeals.forEach((deal) => {
      if (deal.category) {
        categoryMap.set(deal.category, (categoryMap.get(deal.category) || 0) + 1);
      }
      if (deal.audience) {
        audienceMap.set(deal.audience, (audienceMap.get(deal.audience) || 0) + 1);
      }
    });

    // Ensure required audiences always appear
    for (const audience of REQUIRED_AUDIENCES) {
      if (!audienceMap.has(audience)) {
        audienceMap.set(audience, 0);
      }
    }

    return {
      categories: Array.from(categoryMap.entries()).map(([value, count]) => ({
        value,
        label: DEAL_CATEGORY_LABELS[value] || value,
        count,
      })),
      audiences: Array.from(audienceMap.entries()).map(([value, count]) => ({
        value,
        label: DEAL_AUDIENCE_LABELS[value] || value,
        count,
      })),
    };
  }, [allDeals]);

  return { data, isLoading, isError };
}
