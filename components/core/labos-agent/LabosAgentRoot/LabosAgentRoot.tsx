'use client';

import { useLabosAgentAccess } from '@/services/labos-agent/hooks/useLabosAgentAccess';
import { chatKey, useLabosAgentStore } from '@/services/labos-agent/store';

import { LabosAgentPanel } from '../LabosAgentPanel/LabosAgentPanel';

/**
 * Mounts the agent panel once for the whole app (LAB-3298), through `app/ClientDynamics.tsx` (client-only). Renders
 * nothing until a caller runs `openAgent` and the visitor passes the gate (`useLabosAgentAccess`). The chat of each
 * context lives in the store, so reopening from the same context restores it. A new context shows its own chat.
 */
export function LabosAgentRoot() {
  const enabled = useLabosAgentAccess();
  const isOpen = useLabosAgentStore((s) => s.isOpen);
  const context = useLabosAgentStore((s) => s.context);
  const closeAgent = useLabosAgentStore((s) => s.actions.closeAgent);

  if (!enabled || !isOpen) return null;
  return <LabosAgentPanel key={chatKey(context)} context={context} onClose={closeAgent} />;
}
