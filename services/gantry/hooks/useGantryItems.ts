'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchGantryItems } from '../gantry.service';
import { GantryQueryKeys } from '../constants';
import type { GantryListParams } from '../types';

export function useGantryItems(params: GantryListParams, enabled = true) {
  return useQuery({
    queryKey: [GantryQueryKeys.ITEMS, params],
    queryFn: () => fetchGantryItems(params),
    staleTime: 30_000,
    enabled,
  });
}
