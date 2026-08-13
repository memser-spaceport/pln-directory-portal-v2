import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AgentSessionsQueryKeys } from '@/services/agent-sessions/constants';
import { createAgentSession, CreateAgentSessionInput } from '@/services/agent-sessions/agent-sessions.service';

export function useCreateAgentSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateAgentSessionInput) => createAgentSession(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [AgentSessionsQueryKeys.LIST] });
    },
  });
}
