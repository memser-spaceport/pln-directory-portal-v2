'use client';

import { useQuery } from '@tanstack/react-query';
import { AiAppsQueryKeys } from '@/services/ai-apps/constants';
import { fetchAiApp, AiApp } from '@/services/ai-apps/ai-apps.service';

export function useAiApp(uid: string) {
  const { data, isLoading, isError } = useQuery<AiApp | null>({
    queryKey: [AiAppsQueryKeys.AI_APP_DETAIL, uid],
    queryFn: () => fetchAiApp(uid),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 2,
  });

  return {
    app: data ?? null,
    isLoading,
    isError,
  };
}
