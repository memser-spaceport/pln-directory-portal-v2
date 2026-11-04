'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import { getAllDeals } from '@/services/deals/deals.service';
import { DealsQueryKeys } from '@/services/deals/constants';
import { useDealsAccess } from '@/services/deals/hooks/useDealsAccess';
import type { IDeal } from '@/types/deals.types';

/** The rail lists this many deals. */
export const HOME_DEALS_MAX = 3;

/** Newest first, by `createdAt`; ties keep the API's order. */
export function newestDeals(deals: readonly IDeal[], max: number = HOME_DEALS_MAX): IDeal[] {
  return [...deals].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, max);
}

/**
 * The signed-in rail's deals (LAB-3125): the three newest and the catalogue's size, for members with deals access
 * only. Without access it makes no request and returns null, so the section is absent. Shares `/deals`' cache entry
 * (the same key and fetcher as `useGetDeals`).
 */
export function useHomeDeals(): { deals: IDeal[]; total: number } | null {
  const { hasAccess } = useDealsAccess();
  const { data } = useQuery({
    queryKey: [DealsQueryKeys.DEALS_LIST],
    queryFn: getAllDeals,
    staleTime: 60000,
    gcTime: 120000,
    enabled: hasAccess,
  });

  return useMemo(() => {
    // An unexpected response shape degrades to "no deals section", never a throw in the rail.
    if (!hasAccess || !Array.isArray(data) || data.length === 0) return null;
    return { deals: newestDeals(data), total: data.length };
  }, [hasAccess, data]);
}
