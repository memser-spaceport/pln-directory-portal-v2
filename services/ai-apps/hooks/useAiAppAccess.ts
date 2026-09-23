'use client';

import { useQuery } from '@tanstack/react-query';

import { AiAppsQueryKeys } from '@/services/ai-apps/constants';
import { AiAppAccessResult, fetchAiAppAccess } from '@/services/ai-apps/ai-apps.service';

/** Access mode + whitelist for the Manage access modal (app owner only). */
export function useAiAppAccess(uid: string, options?: { enabled?: boolean }) {
  const { data, isLoading } = useQuery<AiAppAccessResult>({
    queryKey: [AiAppsQueryKeys.AI_APP_ACCESS, uid],
    queryFn: () => fetchAiAppAccess(uid),
    // Always fresh when the modal opens: another manager may have changed it.
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
