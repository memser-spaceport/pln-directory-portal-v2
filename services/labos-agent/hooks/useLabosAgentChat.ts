'use client';

import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { useIntroRequestAnalytics, type IntroRequestEventContext } from '@/analytics/intro-requests.analytics';
import {
  agentActionType,
  agentErrorType,
  currentConversationId,
  useLabosAgentAnalytics,
} from '@/analytics/labos-agent.analytics';
import { markIntroRequestSent } from '@/services/intro-requests/intro-request-entry-registry';
import { createIntroRequest } from '@/services/intro-requests/intro-requests.service';
import type {
  LabosAgentCardState,
  LabosAgentChatErrorCode,
  LabosAgentDecision,
  LabosAgentDraft,
  LabosAgentDraftCardState,
  LabosAgentMentionChip,
  LabosAgentOpenContext,
  LabosAgentSurface,
  LabosAgentTurn,
  LabosAgentTurnStatus,
} from '@/types/labos-agent.types';
import { generateUUID } from '@/utils/common.utils';

import {
  draftConfirmErrorState,
  draftErrorState,
  draftTargetKey,
  introErrorStatus,
  isDraftTargetSent,
  toIntroRequestBody,
} from '../labos-agent.drafts';
import { LABOS_AGENT_MENTION_TEXT } from '../constants';
import { isStalledAnswer, LabosAgentError } from '../labos-agent.errors';
import { toChatMentions } from '../labos-agent.mentions';
import { currentIntroDraft, openCards } from '../labos-agent.open-cards';
import { distinctSourceCount } from '../labos-agent.sources';
import { getLabosAgentHistoryClient } from '../labos-agent.history';
import { getLabosAgentClient, toChatContext } from '../labos-agent.service';
import { refreshLabosAgentHistory } from './useLabosAgentThreads';
import { chatKey, useLabosAgentStore } from '../store';

/** LAB-3457: C5 answers that mean the backend has no saved draft to send: the card falls back to C3 once. */
const C5_UNKNOWN_DRAFT: ReadonlySet<string> = new Set(['THREAD_NOT_FOUND', 'DRAFT_NOT_FOUND']);

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
 * LAB-3297 V0-R2: `conversationId` is the UUID of the agent dock session, as on `agent-dock-opened`.
 */
export function draftEventContext(
  draft: LabosAgentDraft,
  context: LabosAgentOpenContext | null,
  surface: LabosAgentSurface = 'panel',
): IntroRequestEventContext {
  const targetType = draft.target.type;
  const entryPoint =
    context?.page === 'intro' && context.entryPoint
      ? context.entryPoint
      : targetType === 'member'
        ? 'member-header'
        : 'team-header';
  const conversationId = currentConversationId(surface);
  return { targetType, entryPoint, source: 'agent', ...(conversationId ? { conversationId } : {}) };
}

/** LAB-3297: the member changed the draft text before Send or Cancel. */
const isDraftEdited = (draft: LabosAgentDraft, text: string) => text.trim() !== draft.text.trim();

/** LAB-3457: how the AI agent chat page runs a chat. The panel passes none. */
export interface LabosAgentChatOptions {
  /** The page's own chat key. Default: `chatKey(context)`, one chat per context (the panel). */
  key?: string;
  /** With `key`: the thread id of the chat, so C1 gets the page's thread. */
  threadId?: string;
  /** The page always sends its context (a chat scoped to one profile). Default: the panel's page chip (`readsPage`). */
  readsContext?: boolean;
  /** For the agent events and the C1 `surface`. Default `panel`. */
  surface?: LabosAgentSurface;
}

/**
 * One chat with the agent, for one context. Turns live in the store (`chats[chatKey(context)]`), so closing the panel
 * keeps the chat and an open stream keeps writing to it. A hard error or a stall marks the turn, and `retry` sends the
 * same message again. LAB-3457: the AI agent chat page runs the same chat under its own key (`options`).
 */
export function useLabosAgentChat(context: LabosAgentOpenContext | null, options: LabosAgentChatOptions = {}) {
  const { threadId: ownThreadId, readsContext, surface = 'panel' } = options;
  const key = options.key ?? chatKey(context);
  const turns = useLabosAgentStore((s) => s.chats[key]?.turns ?? NO_TURNS);
  const { updateTurns, resetChat, markPageUnreadable, countSession, ensureChat, renewThread } = useLabosAgentStore(
    (s) => s.actions,
  );
  const queryClient = useQueryClient();
  const {
    onMessageSent,
    onAnswerShown,
    onAnswerFailed,
    onActionProposed,
    onActionConfirmed,
    onActionCancelled,
    onActionFailed,
  } = useLabosAgentAnalytics(surface);
  const { onDialogOpened, onDialogClosed, onAskSubmitted, onSubmitFailed } = useIntroRequestAnalytics();

  const patch = useCallback(
    (id: string, next: Partial<LabosAgentTurn>) =>
      updateTurns(key, (prev) => prev.map((t) => (t.id === id ? { ...t, ...next } : t))),
    [key, updateTurns],
  );

  const run = useCallback(
    async (message: string, replaceId?: string, chips: LabosAgentMentionChip[] = []) => {
      const id = generateUUID();
      if (ownThreadId) ensureChat(key, ownThreadId);
      const before = useLabosAgentStore.getState();
      const prevTurns = before.chats[key]?.turns ?? NO_TURNS;
      // LAB-3302: after the member removes the page chip, the request has no page context.
      const chatContext = toChatContext((readsContext ?? before.readsPage) ? context : null);
      const mentions = toChatMentions(chips);
      // LAB-3362 (C4-R7): the newest waiting intro card goes with the message. Only `done` turns count, so a retry of
      // an `error` or `stalled` turn never sends a card of that turn.
      const introDraft = currentIntroDraft(prevTurns, before.sentIntroTargets);
      // S6-F20: the first turn of the chat reads no page and no item.
      const first = replaceId ? prevTurns[0]?.id === replaceId : prevTurns.length === 0;
      // LAB-3297: 1 is the first turn of the chat. A retry keeps the place of the turn it replaces.
      const replacedAt = replaceId ? prevTurns.findIndex((t) => t.id === replaceId) : -1;
      const turnIndex = replacedAt >= 0 ? replacedAt + 1 : prevTurns.length + 1;
      const mentionChips = chips.map(({ failed: _failed, ...chip }) => chip);
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
        ...(mentionChips.length > 0 ? { mentions: mentionChips } : {}),
        ...(first && !chatContext && !mentions ? { readsNothing: true as const } : {}),
        startedAt: Date.now(),
      };
      updateTurns(key, (prev) => (replaceId ? prev.map((t) => (t.id === replaceId ? turn : t)) : [...prev, turn]));
      let threadId = useLabosAgentStore.getState().chats[key].threadId;
      countSession('turnCount', 1, surface);
      onMessageSent(context, {
        messageLength: message.length,
        turnIndex,
        isRetry: !!replaceId,
        contextAttached: !!chatContext,
        mentionCount: mentions?.length ?? 0,
      });

      const controller = new AbortController();
      streams.set(key, controller);
      const ask = (thread: string) =>
        getLabosAgentClient().chat(
          // S6-F14: `mentions` in the order of the chips, only when the member picked some.
          // LAB-3362: `introDraft` only while an intro card waits. Its text never goes into an event or a log.
          // LAB-3457: `persist` saves the finished turn in the thread, for the shared history. `surface` (QA1) tells C1
          // whether the turn comes from AI agent chat (`page`) or the panel, so a page intro with no target asks for @.
          {
            threadId: thread,
            chatId: id,
            message,
            context: chatContext,
            ...(mentions ? { mentions } : {}),
            ...(introDraft ? { introDraft } : {}),
            persist: true,
            surface,
          },
          {
            signal: controller.signal,
            onUpdate: (partial) => {
              if (!controller.signal.aborted) patch(id, partial);
            },
          },
        );
      try {
        let body;
        try {
          body = await ask(threadId);
        } catch (err) {
          // LAB-3457: the thread was deleted (or is not the member's). C1 said so before the stream: the chat goes on
          // in a new thread, once.
          if (controller.signal.aborted || !(err instanceof LabosAgentError) || err.code !== 'THREAD_NOT_FOUND')
            throw err;
          threadId = renewThread(key);
          body = await ask(threadId);
        }
        if (controller.signal.aborted) return;
        const stalled = isStalledAnswer(body.content);
        // LAB-3457: the backend saved the finished turn (stopped and failed turns are not saved).
        patch(id, { ...body, status: stalled ? 'stalled' : 'done', endedAt: Date.now(), savedIn: threadId });
        refreshLabosAgentHistory(queryClient, threadId);
        if (stalled) onAnswerFailed(context, { turnIndex, errorType: 'timeout', status: 200 });
        else {
          // V0-R4: the C1 counts when they come. Else the client counts the distinct sources and omits the rest.
          onAnswerShown(context, {
            turnIndex,
            latencyMs: Date.now() - turn.startedAt,
            answerLength: body.content.length,
            sourceCount: body.sourceCount ?? distinctSourceCount(body.sources, body.sourceRefs),
            ...(body.usedWebSearch !== undefined ? { usedWebSearch: body.usedWebSearch } : {}),
            ...(body.toolCount !== undefined ? { toolCount: body.toolCount } : {}),
          });
          const drafts = body.drafts ?? [];
          body.proposals.forEach((p) =>
            onActionProposed(context, {
              actionType: agentActionType(p.tool),
              fieldCount: p.changes.length,
              draftLength: 0,
            }),
          );
          drafts.forEach((d) =>
            onActionProposed(context, {
              actionType: 'intro-draft',
              fieldCount: 1,
              draftLength: d.text.length,
            }),
          );
          if (body.proposals.length + drafts.length > 0)
            countSession('actionCount', body.proposals.length + drafts.length, surface);
          // The draft card is the agent's intro form: one `intro-request-dialog-opened` for each card (LAB-3296).
          drafts.forEach((d) => onDialogOpened(draftEventContext(d, context, surface)));
        }
      } catch (err) {
        if (controller.signal.aborted) return;
        const e = err instanceof LabosAgentError ? err : new LabosAgentError(0, 'UNKNOWN', 'The agent did not answer.');
        // S6-F17: a 404 for a mention has `mentionIndex` and names its chip. A 404 for `context` has no `mentionIndex`.
        const mentionFailed = e.mentionIndex !== undefined;
        const failedChip = mentionFailed ? mentionChips[e.mentionIndex as number] : undefined;
        patch(id, {
          status: 'error',
          error: mentionFailed
            ? {
                code: e.code,
                status: e.status,
                // An index outside the chips still is a mention 404, not a page 404.
                message: failedChip
                  ? LABOS_AGENT_MENTION_TEXT.mentionNotFound(failedChip.label)
                  : LABOS_AGENT_MENTION_TEXT.mentionNotFoundUnknown,
                mentionIndex: e.mentionIndex,
              }
            : { code: e.code, status: e.status, message: errorText(e.code, e.retryAfterSeconds) },
          endedAt: Date.now(),
        });
        // S5-C29: the next open of this context starts with the chip off. Never for a mention 404: the page is fine.
        if (!mentionFailed && PAGE_NOT_FOUND_CODES.has(e.code)) markPageUnreadable(key);
        onAnswerFailed(context, {
          turnIndex,
          errorType: agentErrorType({ status: e.status, code: e.code }),
          status: e.status,
        });
      } finally {
        if (streams.get(key) === controller) streams.delete(key);
      }
    },
    [
      context,
      key,
      ownThreadId,
      readsContext,
      surface,
      ensureChat,
      renewThread,
      queryClient,
      patch,
      updateTurns,
      markPageUnreadable,
      countSession,
      onMessageSent,
      onAnswerShown,
      onAnswerFailed,
      onActionProposed,
      onDialogOpened,
    ],
  );

  const busy = turns.some((t) => t.status === 'working');

  const send = useCallback(
    (raw: string, chips: LabosAgentMentionChip[] = []) => {
      const message = raw.trim();
      if (!message || busy) return false;
      void run(message.slice(0, 2000), undefined, chips);
      return true;
    },
    [busy, run],
  );

  const retry = useCallback(
    (turnId: string) => {
      const turn = turns.find((t) => t.id === turnId);
      if (!turn || busy) return;
      // A mention 404 names the chip that failed. Retry without that chip, so the same 404 does not come back.
      const failedIndex = turn.error?.mentionIndex;
      const mentions =
        failedIndex === undefined ? turn.mentions : turn.mentions?.filter((_, index) => index !== failedIndex);
      void run(turn.message, turnId, mentions);
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

  /** New chat discards the cards that still wait: each one sends one `agent-action-cancelled` (V0-R6). */
  const newChat = useCallback(() => {
    streams.get(key)?.abort();
    streams.delete(key);
    const { chats, sentIntroTargets } = useLabosAgentStore.getState();
    openCards(chats[key]?.turns ?? [], sentIntroTargets).forEach((card) => onActionCancelled(context, card.props));
    resetChat(key);
  }, [key, context, resetChat, onActionCancelled]);

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
      const proposal = turn.proposals.find((p) => p.proposalId === proposalId);
      const actionType = agentActionType(proposal?.tool ?? 'update_my_profile');
      const fieldCount = proposal?.changes.length ?? 0;

      setCard(turnId, proposalId, { status: 'saving', decision });
      // LAB-3297: Cancel counts at the press. The card closes even when the C2 call fails.
      if (decision === 'cancel') onActionCancelled(context, { actionType, edited: false });
      try {
        const res = await getLabosAgentClient().confirmAction({ proposalId, decision });
        setCard(
          turnId,
          proposalId,
          res.status === 'cancelled' ? { status: 'cancelled' } : { status: 'done', summary: res.summary },
        );
        if (decision === 'confirm' && res.status === 'done') {
          countSession('confirmedCount', 1, surface);
          // v0 action cards have no edit, so `edited` is always false.
          onActionConfirmed(context, { actionType, fieldCount, edited: false, draftLength: 0 });
        }
      } catch (err) {
        if (decision === 'cancel') {
          setCard(turnId, proposalId, { status: 'cancelled' });
          return;
        }
        const e = err instanceof LabosAgentError ? err : new LabosAgentError(0, 'UNKNOWN', 'The agent did not answer.');
        const next = cardErrorState(e);
        setCard(turnId, proposalId, next);
        if (next.status === 'error' || next.status === 'forbidden') {
          onActionFailed(context, { actionType, status: e.status });
        }
      }
    },
    [context, key, surface, setCard, countSession, onActionCancelled, onActionConfirmed, onActionFailed],
  );

  const findDraft = useCallback(
    (turnId: string, draftId: string) => {
      const turn = useLabosAgentStore.getState().chats[key]?.turns.find((t) => t.id === turnId);
      const draft = turn?.drafts?.find((d) => d.draftId === draftId);
      if (!turn || !draft) return null;
      const card: LabosAgentDraftCardState = turn.draftCards?.[draftId] ?? { status: 'open', text: draft.text };
      return { turn, draft, card };
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
      const { turn, draft, card } = found;
      if (card.status !== 'open' && card.status !== 'error') return;
      // One intro request for each target in a page visit, across turns and New chat (C3 has no duplicate check).
      const { sentIntroTargets, actions } = useLabosAgentStore.getState();
      if (isDraftTargetSent(draft, sentIntroTargets)) return;
      const text = card.text.trim();
      if (text.length < draft.minLength || text.length > draft.maxLength) return;

      const events = draftEventContext(draft, context, surface);
      setDraftCard(turnId, draftId, { status: 'sending', text: card.text });
      // Claim the target before the request, so a Send on another card for it in the same tick does nothing.
      actions.markIntroTargetSent(draftTargetKey(draft));
      // LAB-3457: a saved draft goes through C5, which keeps the sent state on the server (sent at most once). A
      // draft of a turn that was not saved keeps the C3 path.
      let viaC5 = !!turn.savedIn;
      try {
        if (turn.savedIn) {
          const threadId = turn.savedIn;
          const res = await getLabosAgentHistoryClient()
            .confirmDraft({ threadId, draftId, decision: 'send', text })
            .catch((err: unknown) => {
              // The backend did not save this turn after all (its write failed or ran out of time), or the thread was
              // deleted (another tab). C5 checks the thread before the draft, so it answers THREAD_NOT_FOUND or
              // DRAFT_NOT_FOUND, and nothing was sent. The draft goes as an unsaved one does, through C3, once.
              if (err instanceof LabosAgentError && C5_UNKNOWN_DRAFT.has(err.code)) return null;
              throw err;
            })
            .finally(() => refreshLabosAgentHistory(queryClient, threadId));
          if (!res) viaC5 = false;
          if (res?.status === 'cancelled') {
            setDraftCard(turnId, draftId, { status: 'cancelled', text: card.text });
            useLabosAgentStore.setState((st) => {
              const next = { ...st.sentIntroTargets };
              delete next[draftTargetKey(draft)];
              return { sentIntroTargets: next };
            });
            return;
          }
        }
        if (!viaC5) await createIntroRequest(toIntroRequestBody(draft, text));
        setDraftCard(turnId, draftId, { status: 'sent', text: card.text });
        onAskSubmitted({ ...events, textLength: text.length });
        countSession('confirmedCount', 1, surface);
        onActionConfirmed(context, {
          actionType: 'intro-draft',
          fieldCount: 1,
          edited: isDraftEdited(draft, text),
          draftLength: text.length,
        });
        markIntroRequestSent(draftTargetKey(draft));
      } catch (err) {
        const next = viaC5 ? draftConfirmErrorState(err, card.text) : draftErrorState(err, card.text);
        // The send failed, so the target is free again. A C5 409 that says `sent` keeps it taken.
        if (next.status !== 'sent') {
          useLabosAgentStore.setState((st) => {
            const free = { ...st.sentIntroTargets };
            delete free[draftTargetKey(draft)];
            return { sentIntroTargets: free };
          });
        } else markIntroRequestSent(draftTargetKey(draft));
        setDraftCard(turnId, draftId, next);
        if (next.status === 'sent' || next.status === 'cancelled') return;
        const status = introErrorStatus(err);
        onSubmitFailed({ ...events, status, textLength: text.length });
        onActionFailed(context, { actionType: 'intro-draft', status });
      }
    },
    [
      context,
      surface,
      queryClient,
      findDraft,
      setDraftCard,
      countSession,
      onAskSubmitted,
      onSubmitFailed,
      onActionConfirmed,
      onActionFailed,
    ],
  );

  /** Cancel on a draft card (S3-R14): the card closes and no request goes out. */
  const cancelDraft = useCallback(
    (turnId: string, draftId: string) => {
      const found = findDraft(turnId, draftId);
      if (!found || ['sending', 'sent', 'cancelled'].includes(found.card.status)) return;
      const textLength = found.card.text.trim().length;
      setDraftCard(turnId, draftId, { ...found.card, status: 'cancelled' });
      // LAB-3457: a saved draft is cancelled on the server too, so a reopened chat shows it cancelled. The card closes
      // whatever C5 answers.
      const threadId = found.turn.savedIn;
      if (threadId) {
        void getLabosAgentHistoryClient()
          .confirmDraft({ threadId, draftId, decision: 'cancel' })
          .catch(() => undefined)
          .finally(() => refreshLabosAgentHistory(queryClient, threadId));
      }
      onDialogClosed({
        ...draftEventContext(found.draft, context, surface),
        hadText: textLength > 0,
        textLength,
      });
      onActionCancelled(context, {
        actionType: 'intro-draft',
        edited: isDraftEdited(found.draft, found.card.text),
      });
    },
    [context, surface, queryClient, findDraft, setDraftCard, onDialogClosed, onActionCancelled],
  );

  /** S5-C29: the panel put the text of a failed turn back in the composer. It does that once only. */
  const markTextRestored = useCallback((turnId: string) => patch(turnId, { textRestored: true }), [patch]);

  /** S6-F17: the panel put the chips of a failed turn back in the composer. It does that once only. */
  const markMentionsRestored = useCallback((turnId: string) => patch(turnId, { mentionsRestored: true }), [patch]);

  return {
    turns,
    busy,
    send,
    retry,
    stop,
    newChat,
    decide,
    editDraft,
    sendDraft,
    cancelDraft,
    markTextRestored,
    markMentionsRestored,
  };
}
