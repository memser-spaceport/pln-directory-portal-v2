import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { IDealFilterValues } from '@/types/deals.types';
import { getAllDeals } from '../deals.service';
import {
  DealsQueryKeys,
  DEAL_CATEGORY_LABELS,
  DEAL_AUDIENCE_LABELS,
  DEAL_HIGH_VALUE_FILTER_VALUE,
} from '../constants';

export function useGetDealFilterValues(enabled = true) {
  const { data: allDeals, isLoading, isError } = useQuery({
    queryKey: [DealsQueryKeys.DEALS_LIST],
    queryFn: getAllDeals,
    staleTime: 60000,
    gcTime: 120000,
    enabled,
  });

  const data: IDealFilterValues | undefined = useMemo(() => {
    if (!allDeals) return undefined;

    const categoryMap = new Map<string, number>();
    const audienceMap = new Map<string, number>();
    let highValueCount = 0;
    allDeals.forEach((deal) => {
      if (deal.isHighValue) {
        highValueCount += 1;
      }
      if (deal.category) {
        categoryMap.set(deal.category, (categoryMap.get(deal.category) || 0) + 1);
      }
      if (deal.audience) {
        audienceMap.set(deal.audience, (audienceMap.get(deal.audience) || 0) + 1);
      }
    });

    const categories = Array.from(categoryMap.entries()).map(([value, count]) => ({
      value,
      label: DEAL_CATEGORY_LABELS[value] || value,
      count,
    }));

    if (highValueCount >= 1) {
      categories.unshift({
        value: DEAL_HIGH_VALUE_FILTER_VALUE,
        label: '⭐ High Value',
        count: highValueCount,
      });
    }

    return {
      categories,
      audiences: Array.from(audienceMap.entries()).map(([value, count]) => ({
        value,
        label: DEAL_AUDIENCE_LABELS[value] || value,
        count,
      })),
    };
  }, [allDeals]);

  return { data, isLoading, isError };
}
