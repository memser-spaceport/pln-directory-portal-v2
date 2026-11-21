import { agentActionType, type AgentActionCancelledProps } from '@/analytics/labos-agent.analytics';
import type { LabosAgentChatIntroDraft, LabosAgentTurn } from '@/types/labos-agent.types';

import { draftTargetKey, isDraftTargetSent } from './labos-agent.drafts';

/** True after `expiresAt`. Same rule as the action card, which hides its buttons then. */
const isExpired = (expiresAt?: string) => {
  const at = expiresAt ? Date.parse(expiresAt) : NaN;
  return Number.isFinite(at) && Date.now() >= at;
};

/** The C1 limit of `introDraft.text` (contract 11.1). The same value as the card limit, `INTRO_DRAFT_MAX_LENGTH`. */
const INTRO_DRAFT_TEXT_MAX = 3500;

/** The panel shows the cards of a turn only when the turn is `done` (`LabosAgentTurn`). */
const isShown = (turn: LabosAgentTurn) => turn.status === 'done';

/**
 * LAB-3362 (Oleg's recheck, V0-R9): the draft cards that a newer draft replaced. When a later `done` turn has a draft
 * for the same target, an older card with no state, `open` or `error` is replaced. It shows "Replaced by a newer
 * draft" with no Send and no Cancel, and it no longer waits (`openCards`, `currentIntroDraft`). Two drafts for one
 * target in the same turn do not replace each other. A sent, cancelled, sending or forbidden card keeps its state.
 */
export function replacedDraftIds(turns: LabosAgentTurn[]): Set<string> {
  const replaced = new Set<string>();
  const newer = new Set<string>();
  for (let t = turns.length - 1; t >= 0; t -= 1) {
    const turn = turns[t];
    if (!isShown(turn)) continue;
    const drafts = turn.drafts ?? [];
    for (const d of drafts) {
      const status = turn.draftCards?.[d.draftId]?.status;
      const open = !status || status === 'open' || status === 'error';
      if (open && newer.has(draftTargetKey(d))) replaced.add(d.draftId);
    }
    drafts.forEach((d) => newer.add(draftTargetKey(d)));
  }
  return replaced;
}

/** A draft card waits with no state, `open` or `error`, and only when its target has no intro yet. */
const isDraftWaiting = (
  turn: LabosAgentTurn,
  draft: NonNullable<LabosAgentTurn['drafts']>[number],
  sentIntroTargets: Record<string, true>,
) => {
  const card = turn.draftCards?.[draft.draftId];
  const open = !card || card.status === 'open' || card.status === 'error';
  return open && !isDraftTargetSent(draft, sentIntroTargets);
};

/** One card that still waits for the member: its key (`proposalId` or `draftId`) and its cancel properties. */
export interface LabosAgentOpenCard {
  key: string;
  props: AgentActionCancelledProps;
}

/**
 * LAB-3297 V0-R6: the cards that still wait for the member. New chat discards them, and each one sends one
 * `agent-action-cancelled`. A replaced draft card does not wait and sends no cancel (V0-R9). An action card waits with no state or with `pending`, until its `expiresAt` (an expired
 * card shows no buttons). An action card in `error` with Retry (`canRetry`) also waits. A draft card waits with no
 * state, `open` or `error`, and only when its target has no intro yet ("Intro already requested" does not wait).
 * Only a `done` turn counts: the panel shows cards only for a `done` turn (Oleg, review round 3).
 */
export function openCards(turns: LabosAgentTurn[], sentIntroTargets: Record<string, true>): LabosAgentOpenCard[] {
  const replaced = replacedDraftIds(turns);
  return turns.filter(isShown).flatMap((turn) => [
    ...turn.proposals
      .filter((p) => {
        const card = turn.cards[p.proposalId];
        if (card?.status === 'error') return !!card.canRetry;
        return (!card || card.status === 'pending') && !isExpired(p.expiresAt);
      })
      .map((p) => ({ key: p.proposalId, props: { actionType: agentActionType(p.tool), edited: false } })),
    ...(turn.drafts ?? [])
      .filter((d) => isDraftWaiting(turn, d, sentIntroTargets) && !replaced.has(d.draftId))
      .map((d) => {
        const text = turn.draftCards?.[d.draftId]?.text ?? d.text;
        return {
          key: d.draftId,
          props: { actionType: 'intro-draft' as const, edited: text.trim() !== d.text.trim() },
        };
      }),
  ]);
}

/**
 * LAB-3362 (contract change 4, section 11): the `introDraft` of the next C1 message. It is the newest intro card that
 * still waits (the `openCards` rule), with the current card text and the member's edits. It is absent when no card
 * waits, or when the text is empty after trim. Only a `done` turn counts, as in `openCards`. Retry shows only on an
 * `error` or `stalled` turn, so a retry never sends a card of the turn it replaces. The text stops at 3500 characters (the C1 limit). The text goes only
 * into the C1 body: never into an event or a log.
 */
export function currentIntroDraft(
  turns: LabosAgentTurn[],
  sentIntroTargets: Record<string, true>,
): LabosAgentChatIntroDraft | undefined {
  const replaced = replacedDraftIds(turns);
  for (let t = turns.length - 1; t >= 0; t -= 1) {
    const turn = turns[t];
    if (!isShown(turn)) continue;
    const drafts = turn.drafts ?? [];
    for (let d = drafts.length - 1; d >= 0; d -= 1) {
      const draft = drafts[d];
      if (!isDraftWaiting(turn, draft, sentIntroTargets) || replaced.has(draft.draftId)) continue;
      const text = (turn.draftCards?.[draft.draftId]?.text ?? draft.text).trim().slice(0, INTRO_DRAFT_TEXT_MAX);
      if (!text) return undefined;
      return { target: { type: draft.target.type, uid: draft.target.uid }, text };
    }
  }
  return undefined;
}
