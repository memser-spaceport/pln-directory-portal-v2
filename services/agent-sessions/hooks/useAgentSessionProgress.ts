import { useQuery } from '@tanstack/react-query';
import { AgentSessionsQueryKeys, TERMINAL_SESSION_STATUSES } from '@/services/agent-sessions/constants';
import { fetchAgentSessionProgress } from '@/services/agent-sessions/agent-sessions.service';

export function useAgentSessionProgress(id: string) {
  return useQuery({
    queryKey: [AgentSessionsQueryKeys.PROGRESS, id],
    queryFn: () => fetchAgentSessionProgress(id),
    enabled: Boolean(id),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (!status || TERMINAL_SESSION_STATUSES.has(status) || query.state.data?.terminal) return false;
      return 5000;
    },
  });
}
