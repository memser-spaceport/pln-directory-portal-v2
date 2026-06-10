'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchGantryPinStatus } from '../gantry.service';
import { GantryQueryKeys } from '../constants';

export function useGantryPinStatus(enabled: boolean) {
  return useQuery({
    queryKey: [GantryQueryKeys.PIN_STATUS],
    queryFn: fetchGantryPinStatus,
    enabled,
    staleTime: 30_000,
  });
}
