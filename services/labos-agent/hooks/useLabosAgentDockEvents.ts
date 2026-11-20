'use client';

import { useEffect, useRef } from 'react';

import { useLabosAgentAnalytics } from '@/analytics/labos-agent.analytics';
import type { LabosAgentSession } from '@/types/labos-agent.types';

import { useLabosAgentStore } from '../store';

/**
 * LAB-3297: `agent-dock-opened` when the panel shows, and `agent-dock-closed` when it closes or when a new context
 * replaces the session. A close sends no `agent-action-cancelled`: a card that waits stays in the chat, and the
 * member can still Send, Confirm or Cancel it after a reopen (V0-R6). `LabosAgentRoot` runs this
 * once for the app. `shown` is true when the panel renders (open and the member passes the gate).
 */
export function useLabosAgentDockEvents(shown: boolean) {
  const session = useLabosAgentStore((s) => s.session);
  const { onDockOpened, onDockClosed } = useLabosAgentAnalytics();
  /** The session of the panel on the screen, with its latest counts. `null` when the panel does not show. */
  const active = useRef<LabosAgentSession | null>(null);

  useEffect(() => {
    const close = (ended: LabosAgentSession) => {
      onDockClosed(ended, {
        turnCount: ended.turnCount,
        actionCount: ended.actionCount,
        confirmedCount: ended.confirmedCount,
        openMs: Math.max(0, Date.now() - ended.openedAt),
      });
    };

    const current = active.current;
    if (!shown || !session) {
      if (current) close(current);
      active.current = null;
      return;
    }
    if (current?.conversationId === session.conversationId) {
      // The same session: keep its latest counts for the close.
      active.current = session;
      return;
    }
    if (current) close(current);
    active.current = session;
    onDockOpened(session);
  }, [shown, session, onDockOpened, onDockClosed]);
}
