import { AgentSessionsAccessGuard } from '@/components/page/agent-sessions/AgentSessionsAccessGuard';
import { AgentSessionsPage } from '@/components/page/agent-sessions/AgentSessionsPage';

export default function Page() {
  return (
    <AgentSessionsAccessGuard>
      <AgentSessionsPage />
    </AgentSessionsAccessGuard>
  );
}
