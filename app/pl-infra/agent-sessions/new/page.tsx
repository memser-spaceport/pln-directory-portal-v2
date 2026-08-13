import { AgentSessionsAccessGuard } from '@/components/page/agent-sessions/AgentSessionsAccessGuard';
import { CreateAgentSessionPage } from '@/components/page/agent-sessions/CreateAgentSessionPage';

export default function Page() {
  return (
    <AgentSessionsAccessGuard>
      <CreateAgentSessionPage />
    </AgentSessionsAccessGuard>
  );
}
