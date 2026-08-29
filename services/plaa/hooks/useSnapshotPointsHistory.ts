import { useQuery } from '@tanstack/react-query';
import { fetchPointsHistory, PointsQueryKeys, type SnapshotPointsResponse } from '@/services/points/hooks/usePoints';

export type SnapshotPointsByPeriod = Record<string, SnapshotPointsResponse | null | undefined>;

export function useSnapshotPointsHistory(periods: string[]): SnapshotPointsByPeriod {
  const { data, isLoading } = useQuery({
    queryKey: [PointsQueryKeys.HISTORY],
    queryFn: fetchPointsHistory,
    staleTime: 2 * 60 * 1000,
    retry: 1,
  });

  const byMonth = new Map((data ?? []).map((entry) => [entry.snapshotPeriod.slice(0, 7), entry]));
  const byPeriod: SnapshotPointsByPeriod = {};
  for (const period of periods) {
    byPeriod[period] = isLoading ? undefined : (byMonth.get(period.slice(0, 7)) ?? null);
  }
  return byPeriod;
}
