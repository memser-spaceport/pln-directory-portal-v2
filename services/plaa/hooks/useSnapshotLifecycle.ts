import { useQuery } from '@tanstack/react-query';

// Named for the lifecycle, not the current snapshot: useCurrentSnapshotStatus
// is a different thing entirely (how far through the open month we are).
export interface SnapshotLifecycleEntry {
  roundNumber: number;
  period: string | null;
  status: string | null;
  plaaLocked: boolean;
  isClosed: boolean;
}

export const SnapshotLifecycleQueryKeys = {
  LIFECYCLE: 'snapshot-lifecycle',
} as const;

async function fetchSnapshotLifecycle(): Promise<SnapshotLifecycleEntry[] | null> {
  try {
    const res = await fetch('/api/plaa/snapshot-status', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!res.ok) throw new Error(`Snapshot lifecycle request failed: ${res.status}`);

    return res.json();
  } catch (error) {
    console.error('fetchSnapshotLifecycle error:', error);
    return null;
  }
}

/** Every round's lifecycle state in one request — callers need several periods at once. */
export function useSnapshotLifecycle() {
  return useQuery<SnapshotLifecycleEntry[] | null>({
    queryKey: [SnapshotLifecycleQueryKeys.LIFECYCLE],
    queryFn: fetchSnapshotLifecycle,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}
