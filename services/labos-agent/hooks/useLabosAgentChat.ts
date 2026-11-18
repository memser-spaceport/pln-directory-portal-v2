'use client';

import { useCallback } from 'react';

import { useIntroRequestAnalytics, type IntroRequestEventContext } from '@/analytics/intro-requests.analytics';
import { useLabosAgentAnalytics } from '@/analytics/labos-agent.analytics';
import { markIntroRequestSent } from '@/services/intro-requests/intro-request-entry-registry';
import { createIntroRequest } from '@/services/intro-requests/intro-requests.service';
import type {
  LabosAgentCardState,
  LabosAgentChatErrorCode,
  LabosAgentDecision,
  LabosAgentDraft,
  LabosAgentDraftCardState,
  LabosAgentOpenContext,
  LabosAgentTurn,
  LabosAgentTurnStatus,
} from '@/types/labos-agent.types';
import { generateUUID } from '@/utils/common.utils';

import {
  draftErrorState,
  draftTargetKey,
  introErrorStatus,
  isDraftTargetSent,
  toIntroRequestBody,
} from '../labos-agent.drafts';
import { isStalledAnswer, LabosAgentError } from '../labos-agent.errors';
import { getLabosAgentClient, toChatContext } from '../labos-agent.service';
import { chatKey, useLabosAgentStore } from '../store';

export type { LabosAgentTurn, LabosAgentTurnStatus };

const NO_TURNS: LabosAgentTurn[] = [];

/** The open stream of each chat, by `chatKey`. Module scope, so a stream outlives the panel and Stop still works. */
const streams = new Map<string, AbortController>();

/** S5-C29: C1 cannot read the page of the chip (contract 9.3). The turn keeps the member's text. */
export const PAGE_NOT_FOUND_TEXT = 'The agent cannot read this page. Remove the page chip and ask again.';

/** The C1 codes for a page that the agent cannot read. */
export const PAGE_NOT_FOUND_CODES: ReadonlySet<LabosAgentChatErrorCode> = new Set([
  'MEMBER_NOT_FOUND',
  'TEAM_NOT_FOUND',
  'JOB_NOT_FOUND',
]);

/** The text the panel shows for an error code. Plain words, no codes. */
export function errorText(code: LabosAgentChatErrorCode, retryAfterSeconds?: number): string {
  switch (code) {
    case 'UNAUTHORIZED':
      return 'Sign in again to use the agent.';
    case 'AGENT_NOT_ENABLED':
      return 'The agent is not on for your account yet.';
    case 'NEWS_NOT_FOUND':
      return 'The agent cannot find this news story.';
    case 'INTRO_TARGET_NOT_FOUND':
      return 'The agent cannot find this member or team.';
    case 'MEMBER_NOT_FOUND':
    case 'TEAM_NOT_FOUND':
    case 'JOB_NOT_FOUND':
      return PAGE_NOT_FOUND_TEXT;
    case 'RATE_LIMITED':
      return retryAfterSeconds
        ? `You sent many messages. Try again in ${retryAfterSeconds} seconds.`
        : 'You sent many messages. Try again soon.';
    case 'VALIDATION_ERROR':
      return 'The agent cannot read this message. Write 1 to 2000 characters.';
    default:
      return 'The agent did not finish the answer.';
  }
}

/** The card state after a failed C2 call. Plain words. A 403 says that nothing was saved. */
export function cardErrorState(error: LabosAgentError): LabosAgentCardState {
  if (error.status === 403) return { status: 'forbidden', message: 'You cannot make this change. Nothing was saved.' };
  switch (error.code) {
    case 'PROPOSAL_EXPIRED':
      return { status: 'error', message: 'This change expired. Nothing was saved. Ask the agent again.' };
    case 'PROPOSAL_CLOSED':
      // The 409 body carries the stored status (backend PR #3741). An older backend sends none. `pending` and unknown
      // values arrive here as undefined (`toError`), so they show the "may already be saved" text.
      switch (error.closedStatus) {
        case 'done':
          return { status: 'done', summary: 'This change is already saved.' };
        case 'cancelled':
          return { status: 'cancelled' };
        case 'failed':
          return { status: 'error', message: 'The change did not go through.' };
        default:
          return { status: 'error', message: 'This change may already be saved. Check your profile.' };
      }
    case 'PROPOSAL_NOT_FOUND':
      return { status: 'error', message: 'The agent cannot find this change. Nothing was saved. Ask the agent again.' };
    case 'ACTION_FAILED':
    case 'VALIDATION_ERROR':
      return {
        status: 'error',
        message: error.message ? `The change was refused: ${error.message}` : 'The change was refused.',
      };
    case 'UNAUTHORIZED':
      return { status: 'error', message: 'Sign in again, then retry.', canRetry: true };
    default:
      return { status: 'error', message: 'The change did not go through. Retry.', canRetry: true };
  }
}

/**
 * The LAB-3296 event properties for a draft card: `source` `agent` (S3-R16). The entry point is the place of
 * "Ask the agent". A draft comes only for the intro context, so the fallback is the header of the target type.
 */
export function draftEventContext(
  draft: LabosAgentDraft,
  context: LabosAgentOpenContext | null,
): IntroRequestEventContext {
  const targetType = draft.target.type;
  const entryPoint =
    context?.page === 'intro' && context.entryPoint
      ? context.entryPoint
      : targetType === 'member'
        ? 'member-header'
        : 'team-header';
  return { targetType, entryPoint, source: 'agent' };
}

/**
 * One chat with the agent, for one context. Turns live in the store (`chats[chatKey(context)]`), so closing the panel
 * keeps the chat and an open stream keeps writing to it. A hard error or a stall marks the turn, and `retry` sends the
 * same message again.
 */
export function useLabosAgentChat(context: LabosAgentOpenContext | null) {
  const key = chatKey(context);
  const turns = useLabosAgentStore((s) => s.chats[key]?.turns ?? NO_TURNS);
  const { updateTurns, resetChat } = useLabosAgentStore((s) => s.actions);
  const analytics = useLabosAgentAnalytics();
  const introAnalytics = useIntroRequestAnalytics();
  const page = context?.page ?? 'none';

  const patch = useCallback(
    (id: string, next: Partial<LabosAgentTurn>) =>
      updateTurns(key, (prev) => prev.map((t) => (t.id === id ? { ...t, ...next } : t))),
    [key, updateTurns],
  );

  const run = useCallback(
    async (message: string, replaceId?: string) => {
      const id = generateUUID();
      const turn: LabosAgentTurn = {
        id,
        message,
        status: 'working',
        steps: [],
        content: '',
        sources: [],
        sourceRefs: [],
        followUpQuestions: [],
        proposals: [],
        cards: {},
        drafts: [],
        draftCards: {},
        startedAt: Date.now(),
      };
      updateTurns(key, (prev) => (replaceId ? prev.map((t) => (t.id === replaceId ? turn : t)) : [...prev, turn]));
      const threadId = useLabosAgentStore.getState().chats[key].threadId;
      analytics.onAgentMessageSent({ page, textLength: message.length, isRetry: !!replaceId });

      const controller = new AbortController();
      streams.set(key, controller);
      try {
        const body = await getLabosAgentClient().chat(
          // LAB-3302: after the member removes the page chip, the request has no page context.
          {
            threadId,
            chatId: id,
            message,
            context: toChatContext(useLabosAgentStore.getState().readsPage ? context : null),
          },
          {
            signal: controller.signal,
            onUpdate: (partial) => {
              if (!controller.signal.aborted) patch(id, partial);
            },
          },
        );
        if (controller.signal.aborted) return;
        const stalled = isStalledAnswer(body.content);
        patch(id, { ...body, status: stalled ? 'stalled' : 'done', endedAt: Date.now() });
        if (stalled) analytics.onAgentErrorShown({ page, code: 'STALLED', status: 200 });
        else {
          analytics.onAgentAnswerShown({
            page,
            sourceCount: body.sources.length + body.sourceRefs.length,
            durationMs: Date.now() - turn.startedAt,
          });
          // The draft card is the agent's intro form: one `intro-request-dialog-opened` for each card (LAB-3296).
          (body.drafts ?? []).forEach((d) => introAnalytics.onDialogOpened(draftEventContext(d, context)));
        }
      } catch (err) {
        if (controller.signal.aborted) return;
        const e = err instanceof LabosAgentError ? err : new LabosAgentError(0, 'UNKNOWN', 'The agent did not answer.');
        patch(id, {
          status: 'error',
          error: { code: e.code, status: e.status, message: errorText(e.code, e.retryAfterSeconds) },
          endedAt: Date.now(),
        });
        analytics.onAgentErrorShown({ page, code: e.code, status: e.status });
      } finally {
        if (streams.get(key) === controller) streams.delete(key);
      }
    },
    // `analytics` is a stub with new identities each render; the handlers hold no state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [context, key, page, patch, updateTurns, introAnalytics.onDialogOpened],
  );

  const busy = turns.some((t) => t.status === 'working');

  const send = useCallback(
    (raw: string) => {
      const message = raw.trim();
      if (!message || busy) return false;
      void run(message.slice(0, 2000));
      return true;
    },
    [busy, run],
  );

  const retry = useCallback(
    (turnId: string) => {
      const turn = turns.find((t) => t.id === turnId);
      if (!turn || busy) return;
      void run(turn.message, turnId);
    },
    [busy, run, turns],
  );

  const stop = useCallback(() => {
    streams.get(key)?.abort();
    streams.delete(key);
    updateTurns(key, (prev) =>
      prev.map((t) => (t.status === 'working' ? { ...t, status: 'stopped', endedAt: Date.now() } : t)),
    );
  }, [key, updateTurns]);

  const newChat = useCallback(() => {
    streams.get(key)?.abort();
    streams.delete(key);
    resetChat(key);
  }, [key, resetChat]);

  const setCard = useCallback(
    (turnId: string, proposalId: string, card: LabosAgentCardState) =>
      updateTurns(key, (prev) =>
        prev.map((t) => (t.id === turnId ? { ...t, cards: { ...t.cards, [proposalId]: card } } : t)),
      ),
    [key, updateTurns],
  );

  /**
   * Confirm or Cancel on one action card (C2). Nothing saves before Confirm (D2). A card runs only from `pending` or
   * from a retryable `error`, so a double press sends one request. The guard reads the store, not the render, so two
   * calls in the same tick also send one request. A failed Cancel still closes the card: the backend wrote nothing and
   * the proposal expires. A 409 `PROPOSAL_CLOSED` shows the stored status (`cardErrorState`).
   */
  const decide = useCallback(
    async (turnId: string, proposalId: string, decision: LabosAgentDecision) => {
      const turn = useLabosAgentStore.getState().chats[key]?.turns.find((t) => t.id === turnId);
      if (!turn || !turn.proposals.some((p) => p.proposalId === proposalId)) return;
      const card = turn.cards[proposalId];
      if (card && !(card.status === 'error' && card.canRetry)) return;

      setCard(turnId, proposalId, { status: 'saving', decision });
      try {
        const res = await getLabosAgentClient().confirmAction({ proposalId, decision });
        setCard(
          turnId,
          proposalId,
          res.status === 'cancelled' ? { status: 'cancelled' } : { status: 'done', summary: res.summary },
        );
      } catch (err) {
        if (decision === 'cancel') {
          setCard(turnId, proposalId, { status: 'cancelled' });
          return;
        }
        const e = err instanceof LabosAgentError ? err : new LabosAgentError(0, 'UNKNOWN', 'The agent did not answer.');
        const next = cardErrorState(e);
        setCard(turnId, proposalId, next);
        if (next.status === 'error' || next.status === 'forbidden') {
          analytics.onAgentErrorShown({ page, code: e.code, status: e.status });
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key, page, setCard],
  );

  const findDraft = useCallback(
    (turnId: string, draftId: string) => {
      const turn = useLabosAgentStore.getState().chats[key]?.turns.find((t) => t.id === turnId);
      const draft = turn?.drafts?.find((d) => d.draftId === draftId);
      if (!turn || !draft) return null;
      const card: LabosAgentDraftCardState = turn.draftCards?.[draftId] ?? { status: 'open', text: draft.text };
      return { draft, card };
    },
    [key],
  );

  const setDraftCard = useCallback(
    (turnId: string, draftId: string, card: LabosAgentDraftCardState) =>
      updateTurns(key, (prev) =>
        prev.map((t) => (t.id === turnId ? { ...t, draftCards: { ...(t.draftCards ?? {}), [draftId]: card } } : t)),
      ),
    [key, updateTurns],
  );

  /** The member edits the draft text. Only an open card or a card with an error takes edits. */
  const editDraft = useCallback(
    (turnId: string, draftId: string, text: string) => {
      const found = findDraft(turnId, draftId);
      if (!found || !['open', 'error'].includes(found.card.status)) return;
      setDraftCard(turnId, draftId, { ...found.card, text: text.slice(0, found.draft.maxLength) });
    },
    [findDraft, setDraftCard],
  );

  /**
   * Send on a draft card (S3-R12, S3-R13): one C3 request with `{ type, targetId, text }`. It runs only from `open`
   * or `error`, with the trimmed text in the draft limits. The guard reads the store, so two presses in one tick send
   * one request. After a 200 the card is closed and Send is gone. An error keeps the edited text (contract 8.5).
   */
  const sendDraft = useCallback(
    async (turnId: string, draftId: string) => {
      const found = findDraft(turnId, draftId);
      if (!found) return;
      const { draft, card } = found;
      if (card.status !== 'open' && card.status !== 'error') return;
      // One intro request for each target in a page visit, across turns and New chat (C3 has no duplicate check).
      const { sentIntroTargets, actions } = useLabosAgentStore.getState();
      if (isDraftTargetSent(draft, sentIntroTargets)) return;
      const text = card.text.trim();
      if (text.length < draft.minLength || text.length > draft.maxLength) return;

      const events = draftEventContext(draft, context);
      setDraftCard(turnId, draftId, { status: 'sending', text: card.text });
      // Claim the target before the request, so a Send on another card for it in the same tick does nothing.
      actions.markIntroTargetSent(draftTargetKey(draft));
      try {
        await createIntroRequest(toIntroRequestBody(draft, text));
        setDraftCard(turnId, draftId, { status: 'sent', text: card.text });
        introAnalytics.onAskSubmitted({ ...events, textLength: text.length });
        markIntroRequestSent(draftTargetKey(draft));
      } catch (err) {
        // The send failed, so the target is free again.
        useLabosAgentStore.setState((st) => {
          const next = { ...st.sentIntroTargets };
          delete next[draftTargetKey(draft)];
          return { sentIntroTargets: next };
        });
        setDraftCard(turnId, draftId, draftErrorState(err, card.text));
        introAnalytics.onSubmitFailed({ ...events, status: introErrorStatus(err), textLength: text.length });
      }
    },
    [context, findDraft, introAnalytics, setDraftCard],
  );

  /** Cancel on a draft card (S3-R14): the card closes and no request goes out. */
  const cancelDraft = useCallback(
    (turnId: string, draftId: string) => {
      const found = findDraft(turnId, draftId);
      if (!found || ['sending', 'sent', 'cancelled'].includes(found.card.status)) return;
      const textLength = found.card.text.trim().length;
      setDraftCard(turnId, draftId, { ...found.card, status: 'cancelled' });
      introAnalytics.onDialogClosed({
        ...draftEventContext(found.draft, context),
        hadText: textLength > 0,
        textLength,
      });
    },
    [context, findDraft, introAnalytics, setDraftCard],
  );

  return { turns, busy, send, retry, stop, newChat, decide, editDraft, sendDraft, cancelDraft };
}
