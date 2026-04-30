import { useQuery } from '@tanstack/react-query';
import { getCookiesFromClient } from '@/utils/third-party.helper';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PointsRecord {
  category: string;
  activityName: string;
  description: string;
  points: number;
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
// STUB FLAG – set to true to bypass the real API and return dummy data.
// Revert to false once testing is complete.
// ---------------------------------------------------------------------------
const USE_STUB = false;

const STUB_LIFETIME: LifetimePointsResponse = { totalPoints: 20000 };

const STUB_SNAPSHOT_RECORDS: PointsRecord[] = [
  { category: 'Network Tooling',   activityName: 'Custom Incentive Experiment', description: 'TG Bot',                          points: 175 },
  { category: 'People/Talent',     activityName: 'PL Directory Profile',        description: 'Updated Directory Profile',       points: 323 },
  { category: 'Projects',          activityName: 'Survey Completion',           description: 'Base Reward',                     points: 355 },
  { category: 'Projects',          activityName: 'Cross-Company Project',        description: 'Protocol Research Hub',           points: 464 },
  { category: 'Knowledge Sharing', activityName: 'Host Office Hours',           description: 'Weekly office hours (4 sessions)', points: 214 },
];

async function stubDelay<T>(value: T): Promise<T> {
  // Simulate a fast network response (~200 ms) so loading states are visible
  return new Promise((resolve) => setTimeout(() => resolve(value), 200));
}

// ---------------------------------------------------------------------------
// Fetchers (bare async functions – easy to parallelise with Promise.all)
// ---------------------------------------------------------------------------

async function fetchLifetimePoints(): Promise<LifetimePointsResponse | null> {
  if (USE_STUB) return stubDelay(STUB_LIFETIME);

  // const { authToken } = getCookiesFromClient();
  const authToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InBsYWF1c2VyQHlvcG1haWwuY29tIiwiYXVkIjpbImNsb3JpZzBtdzA1bGlvZGd2ZWx0dnI4cHIiXSwiaWF0IjoxNzc3NDQ3MzIxLCJleHAiOjE3ODc4MTUzMjEsImlzcyI6Imh0dHBzOi8vZGV2LWF1dGgucGxuZXR3b3JrLmlvIiwic3ViIjoiY21vanE4cXE3MGM1eTdqM2F6dDA5MW1oYSIsImp0aSI6IjYzMzEzZmZhOTJhODhkNDQxZDdjZWQwZGRlODkzZTI3In0.Tj7-AdC-TNVwwyexyuEEjILYS-F1dszm2xhRfZrt-lY'
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
  if (USE_STUB) {
    return stubDelay({ snapshotPeriod: `${snapshotPeriod}-01`, records: STUB_SNAPSHOT_RECORDS });
  }

  // const { authToken } = getCookiesFromClient();
  const authToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InBsYWF1c2VyQHlvcG1haWwuY29tIiwiYXVkIjpbImNsb3JpZzBtdzA1bGlvZGd2ZWx0dnI4cHIiXSwiaWF0IjoxNzc3NDQ3MzIxLCJleHAiOjE3ODc4MTUzMjEsImlzcyI6Imh0dHBzOi8vZGV2LWF1dGgucGxuZXR3b3JrLmlvIiwic3ViIjoiY21vanE4cXE3MGM1eTdqM2F6dDA5MW1oYSIsImp0aSI6IjYzMzEzZmZhOTJhODhkNDQxZDdjZWQwZGRlODkzZTI3In0.Tj7-AdC-TNVwwyexyuEEjILYS-F1dszm2xhRfZrt-lY'
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
    console.log('fetchSnapshotPointsResponse', res);

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
    staleTime: 2 * 60 * 1000, // 2 minutes
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
