import { useQuery } from '@tanstack/react-query';
import { getCookiesFromClient } from '@/utils/third-party.helper';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PointsRecord {
  category: string;
  activityName: string;
  description: string;
  pointsCollectedPerSnapshot: number;
}

export interface SnapshotPointsResponse {
  snapshotPeriod: string;
  records: PointsRecord[];
}

export type PointsHistoryResponse = SnapshotPointsResponse[];

// ---------------------------------------------------------------------------
// Query key constants
// ---------------------------------------------------------------------------

export const PointsQueryKeys = {
  SNAPSHOT: 'points-snapshot',
  HISTORY: 'points-history',
} as const;

// ---------------------------------------------------------------------------
// Fetchers (bare async functions – easy to parallelise with Promise.all)
// ---------------------------------------------------------------------------

export async function fetchSnapshotPoints(
  snapshotPeriod: string
): Promise<SnapshotPointsResponse | null> {
  const { authToken } = getCookiesFromClient();
  if (!authToken) return null;

  try {
    const res = await fetch(
      `/api/plaa/points?snapshotPeriod=${snapshotPeriod}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      }
    );

    if (res.status === 403 || res.status === 404) return null;
    if (!res.ok) throw new Error(`Snapshot points request failed: ${res.status}`);

    return res.json();
  } catch (error) {
    console.error('fetchSnapshotPoints error:', error);
    return null;
  }
}

export async function fetchPointsHistory(): Promise<PointsHistoryResponse | null> {
  const { authToken } = getCookiesFromClient();
  if (!authToken) return null;

  try {
    const res = await fetch('/api/plaa/points-history', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
    });

    if (res.status === 403 || res.status === 404) return null;
    if (!res.ok) throw new Error(`Points history request failed: ${res.status}`);

    return res.json();
  } catch (error) {
    console.error('fetchPointsHistory error:', error);
    return null;
  }
}

// ---------------------------------------------------------------------------
// React Query hooks
// ---------------------------------------------------------------------------

/**
 * Fetches the user's points & activity records for a specific snapshot period.
 * @param snapshotPeriod – "YYYY-MM" string, e.g. "2026-04"
 */
export function useSnapshotPoints(snapshotPeriod: string) {
  return useQuery<SnapshotPointsResponse | null>({
    queryKey: [PointsQueryKeys.SNAPSHOT, snapshotPeriod],
    queryFn: () => fetchSnapshotPoints(snapshotPeriod),
    staleTime: 2 * 60 * 1000,
    retry: 1,
    enabled: Boolean(snapshotPeriod),
  });
}
