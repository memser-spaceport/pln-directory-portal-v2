import type { QueryClient } from '@tanstack/react-query';
import { AgentSessionsQueryKeys } from '@/services/agent-sessions/constants';

/**
 * Anything that acts on a session — deploying a feature env, sending a message —
 * can move its status, its progress steps and its thread at once, so they are
 * invalidated together. Sending a message is the sharpest case: it starts a new
 * agent execution, and refreshing only the thread would leave a stale "failed" or
 * "ready" badge beside a session that is running again.
 */
export function invalidateAgentSession(queryClient: QueryClient, id: string) {
  void queryClient.invalidateQueries({ queryKey: [AgentSessionsQueryKeys.DETAIL, id] });
  void queryClient.invalidateQueries({ queryKey: [AgentSessionsQueryKeys.PROGRESS, id] });
  void queryClient.invalidateQueries({ queryKey: [AgentSessionsQueryKeys.MESSAGES, id] });
  void queryClient.invalidateQueries({ queryKey: [AgentSessionsQueryKeys.LIST] });
}
