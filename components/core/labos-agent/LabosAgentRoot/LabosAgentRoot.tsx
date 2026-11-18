'use client';

import dynamic from 'next/dynamic';

import { useLabosAgentAccess } from '@/services/labos-agent/hooks/useLabosAgentAccess';
import { useLabosAgentStore } from '@/services/labos-agent/store';

const LabosAgentPanel = dynamic(() => import('../LabosAgentPanel/LabosAgentPanel').then((m) => m.LabosAgentPanel), {
  ssr: false,
});

/**
 * Mounts the agent panel once for the whole app (LAB-3298). Renders nothing until a caller runs `openAgent` and the
 * visitor passes the gate (`useLabosAgentAccess`). A new context gets a new panel, so a new chat.
 */
export function LabosAgentRoot() {
  const enabled = useLabosAgentAccess();
  const { isOpen, context, session, actions } = useLabosAgentStore();

  if (!enabled || !isOpen) return null;
  return <LabosAgentPanel key={session} context={context} onClose={actions.closeAgent} />;
}
