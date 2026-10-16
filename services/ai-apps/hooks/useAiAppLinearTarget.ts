'use client';

import { useQuery } from '@tanstack/react-query';

import { AiAppsQueryKeys } from '@/services/ai-apps/constants';
import { AiAppLinearResult, AiAppLinearTarget, fetchAiAppLinearTarget } from '@/services/ai-apps/ai-apps.service';

/** Where an app's private feedback goes in Linear (creator or directory admin only). */
export function useAiAppLinearTarget(uid: string, options?: { enabled?: boolean }) {
  const { data, isLoading } = useQuery<AiAppLinearResult<AiAppLinearTarget>>({
    queryKey: [AiAppsQueryKeys.AI_APP_LINEAR_TARGET, uid],
    queryFn: () => fetchAiAppLinearTarget(uid),
    // Fresh each time the menu or modal opens: another manager may have changed it.
    staleTime: 0,
    refetchOnWindowFocus: false,
    enabled: options?.enabled ?? true,
  });

  return {
    target: data?.data ?? null,
    error: data?.error ?? null,
    unavailable: data?.unavailable ?? false,
    forbidden: data?.forbidden ?? false,
    isLoading,
  };
}
