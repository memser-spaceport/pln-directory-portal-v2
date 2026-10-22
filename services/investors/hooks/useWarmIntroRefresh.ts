'use client';

import { useEffect, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { InvestorsQueryKeys } from '../constants';
import { getWarmIntroRefresh, regenerateWarmIntro } from '../warm-intros-v2.service';

export function useWarmIntroRefresh(profileUid: string | null | undefined, enabled: boolean) {
  const queryClient = useQueryClient();
  const previous = useRef<string | null>(null);
  const statusQuery = useQuery({
    queryKey: [InvestorsQueryKeys.WARM_INTROS_V2_PATHS_FOR_INVESTOR, profileUid, 'refresh'],
    queryFn: () => getWarmIntroRefresh(profileUid!),
    enabled: enabled && !!profileUid,
    refetchInterval: (query) => (query.state.data?.run?.status === 'RUNNING' ? 3000 : false),
  });

  const status = statusQuery.data?.run?.status ?? null;

  useEffect(() => {
    if (previous.current === 'RUNNING' && status && status !== 'RUNNING' && profileUid) {
      void queryClient.invalidateQueries({
        queryKey: [InvestorsQueryKeys.WARM_INTROS_V2_PATHS_FOR_INVESTOR, profileUid],
      });
    }
    previous.current = status;
  }, [status, profileUid, queryClient]);

  const start = useMutation({
    mutationFn: () => regenerateWarmIntro(profileUid!),
    onSuccess: () => {
      void statusQuery.refetch();
    },
  });

  return {
    status,
    error: start.error instanceof Error ? start.error.message : null,
    running: status === 'RUNNING' || start.isPending,
    start: () => start.mutate(),
  };
}
