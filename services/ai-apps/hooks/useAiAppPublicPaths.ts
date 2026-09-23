'use client';

import { useQuery } from '@tanstack/react-query';

import { AiAppsQueryKeys } from '@/services/ai-apps/constants';
import { AiAppPublicPathsResult, fetchAiAppPublicPaths } from '@/services/ai-apps/ai-apps.service';

/** Public path patterns for Deployment settings (creator or directory admin only). */
export function useAiAppPublicPaths(uid: string, options?: { enabled?: boolean }) {
  const { data, isLoading } = useQuery<AiAppPublicPathsResult>({
    queryKey: [AiAppsQueryKeys.AI_APP_PUBLIC_PATHS, uid],
    queryFn: () => fetchAiAppPublicPaths(uid),
    // Always fresh when the modal opens: another manager or the agent may have changed it.
    staleTime: 0,
    refetchOnWindowFocus: false,
    enabled: options?.enabled ?? true,
  });

  return {
    settings: data?.data ?? null,
    error: data?.error ?? null,
    isLoading,
  };
}
