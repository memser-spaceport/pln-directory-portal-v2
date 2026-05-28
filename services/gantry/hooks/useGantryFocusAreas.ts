'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { Option } from '@/components/form/FormSelect/types';
import { GantryQueryKeys } from '../constants';
import { fetchGantryFocusAreas } from '../focus-areas.service';

export function useGantryFocusAreas(enabled = true) {
  const query = useQuery({
    queryKey: [GantryQueryKeys.FOCUS_AREAS],
    queryFn: fetchGantryFocusAreas,
    staleTime: 60_000,
    enabled,
  });

  const options: Option[] = useMemo(
    () => (query.data ?? []).map((fa) => ({ label: fa.title, value: fa.uid })),
    [query.data],
  );

  return { ...query, options };
}
