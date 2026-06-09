'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchGantryPinStatus } from '../gantry.service';
import { GantryQueryKeys } from '../constants';
import type { GantryPinStatus } from '../types';

// TODO: set to false when GET /v1/roadmap/me/pin-status is live
const USE_MOCK = true;

const MOCK_PIN_STATUS: GantryPinStatus = { limit: 3, used: 0 };

export function useGantryPinStatus(enabled: boolean) {
  return useQuery({
    queryKey: [GantryQueryKeys.PIN_STATUS],
    queryFn: USE_MOCK ? () => Promise.resolve(MOCK_PIN_STATUS) : fetchGantryPinStatus,
    enabled,
    staleTime: USE_MOCK ? Infinity : 30_000,
  });
}
