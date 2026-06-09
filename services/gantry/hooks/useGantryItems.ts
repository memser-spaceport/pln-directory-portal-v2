'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchGantryItems } from '../gantry.service';
import { GantryQueryKeys, sortGantryItems } from '../constants';
import type { GantryListParams } from '../types';

export function useGantryItems(params: GantryListParams, enabled = true) {
  return useQuery({
    queryKey: [GantryQueryKeys.ITEMS, params],
    queryFn: async () => {
      const response = await fetchGantryItems(params);
      return { ...response, items: sortGantryItems(response.items) };
    },
    staleTime: 30_000,
    enabled,
  });
}
