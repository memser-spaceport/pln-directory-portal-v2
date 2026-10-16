'use client';

import { useQuery } from '@tanstack/react-query';

import { AiAppsQueryKeys } from '@/services/ai-apps/constants';
import { AiAppLinearResult, AiAppLinearTeam, fetchAiAppLinearTeams } from '@/services/ai-apps/ai-apps.service';

/** The private Linear teams the caller may pick for an app's feedback. */
export function useAiAppLinearTeams(options?: { enabled?: boolean }) {
  const { data, isLoading } = useQuery<AiAppLinearResult<AiAppLinearTeam[]>>({
    queryKey: [AiAppsQueryKeys.AI_APP_LINEAR_TEAMS],
    queryFn: fetchAiAppLinearTeams,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    enabled: options?.enabled ?? true,
  });

  return {
    teams: data?.data ?? null,
    error: data?.error ?? null,
    unavailable: data?.unavailable ?? false,
    isLoading,
  };
}
