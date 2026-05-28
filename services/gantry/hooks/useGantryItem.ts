'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchGantryItem } from '../gantry.service';
import { GantryQueryKeys } from '../constants';

export function useGantryItem(uid: string) {
  return useQuery({
    queryKey: [GantryQueryKeys.ITEM, uid],
    queryFn: () => fetchGantryItem(uid),
    enabled: !!uid,
    staleTime: 30_000,
  });
}
