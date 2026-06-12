'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { fetchCrosswalkReview } from '../lists.service';
import { InvestorsQueryKeys } from '../constants';

/**
 * Entity-resolution candidates awaiting human review (paginated). Drives the
 * crosswalk review queue panel. Enabled only when the curator opens the panel.
 */
export function useCrosswalkReview(page: number, limit: number, enabled: boolean) {
  return useQuery({
    queryKey: [InvestorsQueryKeys.CROSSWALK_REVIEW, page, limit],
    queryFn: () => fetchCrosswalkReview(page, limit),
    enabled,
    staleTime: 30_000,
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: false,
  });
}
