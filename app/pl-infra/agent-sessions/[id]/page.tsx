'use client';

import { use } from 'react';

import { AgentSessionsAccessGuard } from '@/components/page/agent-sessions/AgentSessionsAccessGuard';
import { AgentSessionDetailPage } from '@/components/page/agent-sessions/AgentSessionDetailPage';

interface Props {
  params: Promise<{ id: string }>;
}

export default function Page(props: Props) {
  const params = use(props.params);

  return (
    <AgentSessionsAccessGuard>
      <AgentSessionDetailPage sessionId={params.id} />
    </AgentSessionsAccessGuard>
  );
}
