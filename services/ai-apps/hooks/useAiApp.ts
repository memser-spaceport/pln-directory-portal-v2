'use client';

import { useQuery } from '@tanstack/react-query';
import { AiAppsQueryKeys } from '@/services/ai-apps/constants';
import { fetchAiApp, FetchAiAppResult } from '@/services/ai-apps/ai-apps.service';

export function useAiApp(uid: string, options?: { enabled?: boolean }) {
  const { data, isLoading, isError } = useQuery<FetchAiAppResult>({
    queryKey: [AiAppsQueryKeys.AI_APP_DETAIL, uid],
    queryFn: () => fetchAiApp(uid),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 2,
    // The card menu mounts this hook per card but must only fetch while open.
    enabled: options?.enabled ?? true,
    // While a deploy is in flight (e.g. agent-triggered), keep polling so the
    // page picks up the settled READY/ERROR state — including the backend
    // marking a stuck deploy as failed — without a manual reload.
    refetchInterval: (query) => (query.state.data?.app?.status === 'DEPLOYING' ? 5000 : false),
  });

  return {
    app: data?.app ?? null,
    // Why fetch errors are data, not thrown: distinguishes "no access" (fresh,
    // authoritative) from "couldn't verify" (transient) for the manage menu.
    errorKind: data?.errorKind ?? null,
    isLoading,
    isError,
  };
}
