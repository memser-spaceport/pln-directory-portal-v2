import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AgentSessionsQueryKeys } from '@/services/agent-sessions/constants';
import {
  deleteAgentSessionFeatureEnv,
  deployAgentSessionFeatureEnv,
} from '@/services/agent-sessions/agent-sessions.service';

type FeatureEnvActionInput = {
  force?: boolean;
};

function invalidateSession(queryClient: ReturnType<typeof useQueryClient>, id: string) {
  void queryClient.invalidateQueries({ queryKey: [AgentSessionsQueryKeys.DETAIL, id] });
  void queryClient.invalidateQueries({ queryKey: [AgentSessionsQueryKeys.PROGRESS, id] });
  void queryClient.invalidateQueries({ queryKey: [AgentSessionsQueryKeys.LIST] });
}

export function useDeployAgentSessionFeatureEnv(sessionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ force = false }: FeatureEnvActionInput = {}) =>
      deployAgentSessionFeatureEnv(sessionId, force),
    onSuccess: () => invalidateSession(queryClient, sessionId),
  });
}

export function useDeleteAgentSessionFeatureEnv(sessionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ force = false }: FeatureEnvActionInput = {}) =>
      deleteAgentSessionFeatureEnv(sessionId, force),
    onSuccess: () => invalidateSession(queryClient, sessionId),
  });
}
