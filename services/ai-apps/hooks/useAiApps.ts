'use client';

import { useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AiAppsQueryKeys } from '@/services/ai-apps/constants';
import { fetchAiApps, AiApp } from '@/services/ai-apps/ai-apps.service';

// Poll cadence while a deploy is in flight: quick at first, backing off, with
// a hard stop — the backend marks stuck deploys failed, so an endless poll
// only burns requests. (The detail page has its own 5s poll via useAiApp.)
const DEPLOY_POLL_STEPS_MS: Array<[elapsedBelowMs: number, intervalMs: number]> = [
  [30_000, 5_000],
  [90_000, 15_000],
  [5 * 60_000, 30_000],
];

export function useAiApps() {
  // When the first DEPLOYING app was observed — drives the backoff schedule.
  // Read/written only inside the refetchInterval callback (not during render).
  const deployPollStartedAtRef = useRef<number | null>(null);

  const { data, isLoading, isError } = useQuery<AiApp[]>({
    queryKey: [AiAppsQueryKeys.AI_APPS_LIST],
    queryFn: fetchAiApps,
    staleTime: 5 * 60 * 1000,
    retry: 2,
    // Without this, a card-menu redeploy would strand a "Deploying" badge on
    // the list forever (staleTime is 5 min and nothing else refetches it).
    refetchInterval: (query) => {
      const anyDeploying = (query.state.data ?? []).some((app) => app.status === 'DEPLOYING');
      if (!anyDeploying) {
        deployPollStartedAtRef.current = null;
        return false;
      }
      deployPollStartedAtRef.current ??= Date.now();
      const elapsed = Date.now() - deployPollStartedAtRef.current;
      const step = DEPLOY_POLL_STEPS_MS.find(([elapsedBelow]) => elapsed < elapsedBelow);
      return step ? step[1] : false;
    },
  });

  return {
    apps: data ?? [],
    isLoading,
    isError,
  };
}
