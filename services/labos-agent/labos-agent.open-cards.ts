import { agentActionType, type AgentActionCancelledProps } from '@/analytics/labos-agent.analytics';
import type { LabosAgentTurn } from '@/types/labos-agent.types';

import { isDraftTargetSent } from './labos-agent.drafts';

/** One card that still waits for the member: its key (`proposalId` or `draftId`) and its cancel properties. */
export interface LabosAgentOpenCard {
  key: string;
  props: AgentActionCancelledProps;
}

/**
 * LAB-3297 V0-R6: the cards that still wait for the member. New chat discards them, and each one sends one
 * `agent-action-cancelled`. An action card waits with no state or with `pending`. A draft card waits with no state,
 * `open` or `error`, and only when its target has no intro yet ("Intro already requested" does not wait).
 */
export function openCards(turns: LabosAgentTurn[], sentIntroTargets: Record<string, true>): LabosAgentOpenCard[] {
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
