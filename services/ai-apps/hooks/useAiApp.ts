'use client';

import { useQuery } from '@tanstack/react-query';
import { AiAppsQueryKeys } from '@/services/ai-apps/constants';
import { fetchAiApp, AiApp } from '@/services/ai-apps/ai-apps.service';

export function useAiApp(uid: string) {
  const { data, isLoading, isError } = useQuery<AiApp | null>({
    queryKey: [AiAppsQueryKeys.AI_APP_DETAIL, uid],
    queryFn: () => fetchAiApp(uid),
    staleTime: 5 * 60 * 1000,
    retry: 2,
    // While a deploy is in flight (e.g. agent-triggered), keep polling so the
    // page picks up the settled READY/ERROR state — including the backend
    // marking a stuck deploy as failed — without a manual reload.
    refetchInterval: (query) => (query.state.data?.status === 'DEPLOYING' ? 5000 : false),
  });

  return {
    app: data ?? null,
    isLoading,
    isError,
  };
}
