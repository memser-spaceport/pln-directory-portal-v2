import { useQuery } from '@tanstack/react-query';
import { AgentSessionsQueryKeys } from '@/services/agent-sessions/constants';
import { fetchAgentSessions } from '@/services/agent-sessions/agent-sessions.service';

export function useAgentSessions() {
  return useQuery({
    queryKey: [AgentSessionsQueryKeys.LIST],
    queryFn: fetchAgentSessions,
  });
}
