import { useQuery } from '@tanstack/react-query';
import type { RoundStatsResponse } from '@/services/plaa/rounds.service';

export const RoundStatsQueryKeys = {
  CURRENT: 'plaa-current-round-stats',
} as const;

async function fetchCurrentRoundStats(): Promise<RoundStatsResponse | null> {
  try {
    const res = await fetch('/api/plaa/round-stats', { method: 'GET' });
    if (!res.ok) return null;
    return res.json();
  } catch (error) {
    console.error('fetchCurrentRoundStats error:', error);
    return null;
  }
}

/** Goes through /api/plaa/round-stats since PLAA_API_URL isn't reachable client-side. */
export function useCurrentRoundStats() {
  return useQuery<RoundStatsResponse | null>({
    queryKey: [RoundStatsQueryKeys.CURRENT],
    queryFn: fetchCurrentRoundStats,
    staleTime: 2 * 60 * 1000,
    retry: 1,
  });
}
