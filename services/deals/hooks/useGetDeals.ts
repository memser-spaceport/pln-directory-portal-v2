import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { IDeal } from '@/types/deals.types';
import { getAllDeals } from '../deals.service';
import { DealsQueryKeys, DEALS_PER_PAGE, DEAL_HIGH_VALUE_FILTER_VALUE } from '../constants';

interface UseGetDealsParams {
  q?: string;
  categories?: string;
  audiences?: string;
  sort?: string;
  page?: number;
}

function filterAndSort(deals: IDeal[], params: UseGetDealsParams) {
  let filtered = deals;

  if (params.q) {
    const query = params.q.toLowerCase();
    filtered = filtered.filter(
      (deal) =>
        deal.vendorName.toLowerCase().includes(query) || deal.shortDescription.toLowerCase().includes(query)
    );
  }

  if (params.categories) {
    const selected = params.categories.split(',');
    filtered = filtered.filter((deal) =>
      selected.some((key) =>
        key === DEAL_HIGH_VALUE_FILTER_VALUE ? Boolean(deal.isHighValue) : deal.category === key
      )
    );
  }

  if (params.audiences) {
    const selected = params.audiences.split(',');
    filtered = filtered.filter((deal) => selected.includes(deal.audience));
  }

  const sorted = [...filtered];
  sorted.sort((a, b) => {
    if (params.sort === 'highValueFirst') {
      const aHigh = a.isHighValue ? 1 : 0;
      const bHigh = b.isHighValue ? 1 : 0;
      if (bHigh !== aHigh) return bHigh - aHigh;
      return a.vendorName.localeCompare(b.vendorName);
    }
    if (params.sort === 'desc') {
      return b.vendorName.localeCompare(a.vendorName);
    }
    return a.vendorName.localeCompare(b.vendorName);
  });

  const page = params.page || 1;
  const end = page * DEALS_PER_PAGE;
  const paginated = sorted.slice(0, end);

  return {
    deals: paginated,
    totalItems: sorted.length,
    hasMore: end < sorted.length,
  };
}

export function useGetDeals(params: UseGetDealsParams, enabled = true) {
  const { data: allDeals, isLoading, isError } = useQuery({
    queryKey: [DealsQueryKeys.DEALS_LIST],
    queryFn: getAllDeals,
    staleTime: 60000,
    gcTime: 120000,
    enabled,
  });

  const result = useMemo(() => {
    if (!allDeals) return { deals: [], totalItems: 0, hasMore: false };
    return filterAndSort(allDeals, params);
  }, [allDeals, params]);

  return { data: result, isLoading, isError };
}
