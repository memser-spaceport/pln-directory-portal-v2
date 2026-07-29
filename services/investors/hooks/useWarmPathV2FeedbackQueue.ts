'use client';

import { useQuery } from '@tanstack/react-query';
import { InvestorsQueryKeys } from '../constants';
import { listWarmPathFeedback } from '../warm-intros-v2.service';

export function useWarmPathV2FeedbackQueue(
  params: { q?: string; limit?: number; offset?: number } = {},
  enabled = true,
) {
  return useQuery({
    queryKey: [
      InvestorsQueryKeys.WARM_INTROS_V2_FEEDBACK_QUEUE,
      params.q ?? null,
      params.limit ?? 50,
      params.offset ?? 0,
    ],
    queryFn: () => listWarmPathFeedback(params),
    enabled,
    staleTime: 30 * 1000,
  });
}
