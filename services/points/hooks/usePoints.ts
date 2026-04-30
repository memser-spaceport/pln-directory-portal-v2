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

export interface LifetimePointsResponse {
  totalPoints: number;
}

export interface SnapshotPointsResponse {
  snapshotPeriod: string;
  records: PointsRecord[];
}

// ---------------------------------------------------------------------------
// Query key constants
// ---------------------------------------------------------------------------

export const PointsQueryKeys = {
  LIFETIME: 'points-lifetime',
  SNAPSHOT: 'points-snapshot',
} as const;

// ---------------------------------------------------------------------------
// Fetchers (bare async functions – easy to parallelise with Promise.all)
// ---------------------------------------------------------------------------

async function fetchLifetimePoints(): Promise<LifetimePointsResponse | null> {
  const { authToken } = getCookiesFromClient();
  if (!authToken) return null;

  try {
    const res = await fetch('/api/plaa/points', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
    });

    if (res.status === 403 || res.status === 404) return null;
    if (!res.ok) throw new Error(`Lifetime points request failed: ${res.status}`);

    return res.json();
  } catch (error) {
    console.error('fetchLifetimePoints error:', error);
    return null;
  }
}

async function fetchSnapshotPoints(
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

// ---------------------------------------------------------------------------
// React Query hooks
// ---------------------------------------------------------------------------

/** Fetches the user's all-time accumulated points. */
export function useLifetimePoints() {
  return useQuery<LifetimePointsResponse | null>({
    queryKey: [PointsQueryKeys.LIFETIME],
    queryFn: fetchLifetimePoints,
    staleTime: 2 * 60 * 1000,
    retry: 1,
  });
}

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
