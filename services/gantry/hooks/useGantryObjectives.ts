'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchGantryObjectives } from '../gantry.service';
import { GantryQueryKeys } from '../constants';

export function useGantryObjectives() {
  return useQuery({
    queryKey: [GantryQueryKeys.OBJECTIVES],
    queryFn: fetchGantryObjectives,
    staleTime: 5 * 60 * 1000,
  });
}
