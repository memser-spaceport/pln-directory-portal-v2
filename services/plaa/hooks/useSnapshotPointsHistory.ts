import { useQueries } from '@tanstack/react-query';
import { fetchSnapshotPoints, PointsQueryKeys, type SnapshotPointsResponse } from '@/services/points/hooks/usePoints';

export type SnapshotPointsByPeriod = Record<string, SnapshotPointsResponse | null | undefined>;

export function useSnapshotPointsHistory(periods: string[]): SnapshotPointsByPeriod {
  const results = useQueries({
    queries: periods.map((period) => ({
      queryKey: [PointsQueryKeys.SNAPSHOT, period],
      queryFn: () => fetchSnapshotPoints(period),
      staleTime: 2 * 60 * 1000,
      retry: 1,
    })),
  });

  const byPeriod: SnapshotPointsByPeriod = {};
  periods.forEach((period, i) => {
    byPeriod[period] = results[i].isLoading ? undefined : (results[i].data ?? null);
  });
  return byPeriod;
}
