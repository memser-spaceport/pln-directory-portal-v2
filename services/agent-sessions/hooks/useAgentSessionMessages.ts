import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AgentSessionsQueryKeys, TERMINAL_SESSION_STATUSES } from '@/services/agent-sessions/constants';
import {
  fetchAgentSessionMessages,
  isPermanentAgentSessionError,
  sendAgentSessionMessage,
} from '@/services/agent-sessions/agent-sessions.service';
import { invalidateAgentSession } from '@/services/agent-sessions/invalidateAgentSession';

/**
 * `sessionStatus` must come from the live session query rather than a value captured
 * at mount: sending a message on a finished session starts a new execution, and
 * polling has to resume when the status leaves the terminal set.
 */
export function useAgentSessionMessages(id: string, sessionStatus?: string) {
  return useQuery({
    queryKey: [AgentSessionsQueryKeys.MESSAGES, id],
    queryFn: () => fetchAgentSessionMessages(id),
    enabled: Boolean(id),
    // A 404 (backend without the messages route) or 403 (not an admin) will never
    // succeed on retry — surface it immediately instead of leaving "Loading
    // messages…" on screen through three backed-off attempts.
    retry: (failureCount, error) => !isPermanentAgentSessionError(error) && failureCount < 3,
    refetchInterval: () => {
      if (!sessionStatus || TERMINAL_SESSION_STATUSES.has(sessionStatus)) return false;
      return 5000;
    },
  });
}

export function useSendAgentSessionMessage(sessionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (message: string) => sendAgentSessionMessage(sessionId, message),
    onSuccess: () => invalidateAgentSession(queryClient, sessionId),
  });
}
