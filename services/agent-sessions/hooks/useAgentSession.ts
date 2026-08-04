import { useQuery } from '@tanstack/react-query';
import { AgentSessionsQueryKeys, TERMINAL_SESSION_STATUSES } from '@/services/agent-sessions/constants';
import { fetchAgentSession } from '@/services/agent-sessions/agent-sessions.service';

export function useAgentSession(id: string) {
  return useQuery({
    queryKey: [AgentSessionsQueryKeys.DETAIL, id],
    queryFn: () => fetchAgentSession(id),
    enabled: Boolean(id),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (!status || TERMINAL_SESSION_STATUSES.has(status)) return false;
      return 5000;
    },
  });
}
