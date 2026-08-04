import { useQuery } from '@tanstack/react-query';
import { AgentSessionsQueryKeys } from '@/services/agent-sessions/constants';
import { fetchAgentSessionRepositories } from '@/services/agent-sessions/agent-sessions.service';

export function useAgentSessionRepositories() {
  return useQuery({
    queryKey: [AgentSessionsQueryKeys.REPOSITORIES],
    queryFn: fetchAgentSessionRepositories,
  });
}
