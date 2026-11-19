'use client';

import { useEffect, useRef } from 'react';

import {
  agentActionType,
  useLabosAgentAnalytics,
  type AgentActionCancelledProps,
} from '@/analytics/labos-agent.analytics';
import type { LabosAgentSession, LabosAgentTurn } from '@/types/labos-agent.types';

import { isDraftTargetSent } from '../labos-agent.drafts';
import { chatKey, useLabosAgentStore } from '../store';

/** One open card at the close of the dock: its key (`proposalId` or `draftId`) and its cancel properties. */
export interface LabosAgentOpenCard {
  key: string;
  props: AgentActionCancelledProps;
}

/**
 * LAB-3297: the cards that still wait for the member when the dock closes. An action card is open with no state or
 * with `pending`. A draft card is open with no state, `open` or `error`, and only when its target has no intro yet.
 */
export function openCardsAtClose(
  turns: LabosAgentTurn[],
  sentIntroTargets: Record<string, true>,
): LabosAgentOpenCard[] {
  return turns.flatMap((turn) => [
    ...turn.proposals
      .filter((p) => !turn.cards[p.proposalId] || turn.cards[p.proposalId].status === 'pending')
      .map((p) => ({ key: p.proposalId, props: { actionType: agentActionType(p.tool), edited: false } })),
    ...(turn.drafts ?? [])
      .filter((d) => {
        const card = turn.draftCards?.[d.draftId];
        const open = !card || card.status === 'open' || card.status === 'error';
        return open && !isDraftTargetSent(d, sentIntroTargets);
      })
      .map((d) => {
        const text = turn.draftCards?.[d.draftId]?.text ?? d.text;
        return {
          key: d.draftId,
          props: { actionType: 'intro-draft' as const, edited: text.trim() !== d.text.trim() },
        };
      }),
  ]);
}

/** Cards that already sent a cancel at a close, so a second close of the same chat does not count them again. */
const cancelledAtClose = new Set<string>();

/** For tests only. */
export const resetDockEventsForTest = () => cancelledAtClose.clear();

/**
 * LAB-3297: `agent-dock-opened` when the panel shows, and `agent-dock-closed` when it closes or when a new context
 * replaces the session. At the close, each open card sends one `agent-action-cancelled`. `LabosAgentRoot` runs this
 * once for the app. `shown` is true when the panel renders (open and the member passes the gate).
 */
export function useLabosAgentDockEvents(shown: boolean) {
  const session = useLabosAgentStore((s) => s.session);
  const { onDockOpened, onDockClosed, onActionCancelled } = useLabosAgentAnalytics();
  /** The session of the panel on the screen, with its latest counts. `null` when the panel does not show. */
  const active = useRef<LabosAgentSession | null>(null);

  useEffect(() => {
    const close = (ended: LabosAgentSession) => {
      const { chats, sentIntroTargets } = useLabosAgentStore.getState();
      const turns = chats[chatKey(ended.context)]?.turns ?? [];
      openCardsAtClose(turns, sentIntroTargets)
        .filter((card) => !cancelledAtClose.has(card.key))
        .forEach((card) => {
          cancelledAtClose.add(card.key);
          onActionCancelled(ended.context, card.props, ended);
        });
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
  }, [shown, session, onDockOpened, onDockClosed, onActionCancelled]);
}
