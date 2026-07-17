'use client';

import { useQuery } from '@tanstack/react-query';
import { AiAppsQueryKeys } from '@/services/ai-apps/constants';
import { fetchAiAppPrdSize, FetchPrdSizeResult } from '@/services/ai-apps/ai-apps.service';

/** Byte size of an existing one-pager, via a HEAD request — no need to download the file just to preview it. */
export function useAiAppPrdSize(prdUrl: string | null) {
  const { data, isLoading } = useQuery<FetchPrdSizeResult>({
    queryKey: [AiAppsQueryKeys.AI_APP_PRD_SIZE, prdUrl],
    queryFn: () => fetchAiAppPrdSize(prdUrl as string),
    enabled: !!prdUrl,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  return {
    size: data?.size ?? null,
    isLoading,
  };
}
