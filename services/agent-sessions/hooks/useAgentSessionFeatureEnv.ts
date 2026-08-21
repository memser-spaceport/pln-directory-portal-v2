import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  deleteAgentSessionFeatureEnv,
  deployAgentSessionFeatureEnv,
} from '@/services/agent-sessions/agent-sessions.service';
import { invalidateAgentSession } from '@/services/agent-sessions/invalidateAgentSession';

type FeatureEnvActionInput = {
  force?: boolean;
};

export function useDeployAgentSessionFeatureEnv(sessionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ force = false }: FeatureEnvActionInput = {}) =>
      deployAgentSessionFeatureEnv(sessionId, force),
    onSuccess: () => invalidateAgentSession(queryClient, sessionId),
  });
}

export function useDeleteAgentSessionFeatureEnv(sessionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ force = false }: FeatureEnvActionInput = {}) =>
      deleteAgentSessionFeatureEnv(sessionId, force),
    onSuccess: () => invalidateAgentSession(queryClient, sessionId),
  });
}
