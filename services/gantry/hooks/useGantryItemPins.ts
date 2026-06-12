'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchGantryItemPins } from '../gantry.service';
import { GantryQueryKeys } from '../constants';
import type { GantryPinner } from '../types';

export function useGantryItemPins(uid: string, enabled: boolean) {
  return useQuery<GantryPinner[]>({
    queryKey: [GantryQueryKeys.ITEM_PINS, uid],
    queryFn: () => fetchGantryItemPins(uid),
    enabled,
    staleTime: 60_000,
  });
}
