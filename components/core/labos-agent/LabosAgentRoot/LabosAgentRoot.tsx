'use client';

import { useMemo } from 'react';
import { createPortal } from 'react-dom';

import { isPassthroughModalOpen } from '@/services/labos-agent/labos-agent.dialogs';
import { useLabosAgentAccess } from '@/services/labos-agent/hooks/useLabosAgentAccess';
import { useLabosAgentDockEvents } from '@/services/labos-agent/hooks/useLabosAgentDockEvents';
import { chatKey, useLabosAgentStore } from '@/services/labos-agent/store';

import { LabosAgentPanel } from '../LabosAgentPanel/LabosAgentPanel';

/**
 * Mounts the agent panel once for the whole app (LAB-3298), through `app/ClientDynamics.tsx` (client-only). Renders
 * nothing until a caller runs `openAgent` and the visitor passes the gate (`useLabosAgentAccess`). The chat of each
 * context lives in the store, so reopening from the same context restores it. A new context shows its own chat.
 *
 * LAB-3302: the panel portals to `<body>`. When it opens over the news story modal (`isPassthroughModalOpen`), it goes
 * above the story (`overModal`) and stays out of the story's `inert` background.
 *
 * LAB-3297: the dock events (`agent-dock-opened`, `agent-dock-closed`) fire here, for every way to open the panel.
 */
export function LabosAgentRoot() {
  const enabled = useLabosAgentAccess();
  const isOpen = useLabosAgentStore((s) => s.isOpen);
  const context = useLabosAgentStore((s) => s.context);
  const closeAgent = useLabosAgentStore((s) => s.actions.closeAgent);

  // Read once for each open: a story that opens later stays above the panel, as any page content does.
  const overModal = useMemo(() => isOpen && isPassthroughModalOpen(), [isOpen]);
  useLabosAgentDockEvents(!!enabled && isOpen);

  if (!enabled || !isOpen) return null;
  return createPortal(
    <LabosAgentPanel key={chatKey(context)} context={context} onClose={closeAgent} overModal={overModal} />,
    document.body,
  );
}
