'use client';

import { useQuery } from '@tanstack/react-query';
import { AiAppsQueryKeys } from '@/services/ai-apps/constants';
import { fetchAiAppPrdContent, FetchPrdContentResult } from '@/services/ai-apps/ai-apps.service';

/** Fetches one-pager text from its stored S3 URL. Only runs while the viewer is open. */
export function useAiAppPrdContent(prdUrl: string | null, options?: { enabled?: boolean }) {
  const { data, isLoading, isError } = useQuery<FetchPrdContentResult>({
    queryKey: [AiAppsQueryKeys.AI_APP_PRD_CONTENT, prdUrl],
    queryFn: () => fetchAiAppPrdContent(prdUrl as string),
    enabled: !!prdUrl && (options?.enabled ?? true),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  return {
    content: data?.content ?? null,
    error: data?.error ?? (isError ? 'One-pager could not be loaded' : null),
    isLoading,
  };
}
