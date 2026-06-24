'use client';

import { useQuery } from '@tanstack/react-query';
import { AiAppsQueryKeys } from '@/services/ai-apps/constants';
import { fetchAiApps, AiApp } from '@/services/ai-apps/ai-apps.service';

export function useAiApps() {
  const { data, isLoading, isError } = useQuery<AiApp[]>({
    queryKey: [AiAppsQueryKeys.AI_APPS_LIST],
    queryFn: fetchAiApps,
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });

  return {
    apps: data ?? [],
    isLoading,
    isError,
  };
}
