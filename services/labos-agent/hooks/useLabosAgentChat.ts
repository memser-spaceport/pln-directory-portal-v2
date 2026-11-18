'use client';

import { useCallback } from 'react';

import { useLabosAgentAnalytics } from '@/analytics/labos-agent.analytics';
import type {
  LabosAgentChatErrorCode,
  LabosAgentOpenContext,
  LabosAgentTurn,
  LabosAgentTurnStatus,
} from '@/types/labos-agent.types';
import { generateUUID } from '@/utils/common.utils';

import { isStalledAnswer, LabosAgentError } from '../labos-agent.errors';
import { getLabosAgentClient, toChatContext } from '../labos-agent.service';
import { chatKey, useLabosAgentStore } from '../store';

export type { LabosAgentTurn, LabosAgentTurnStatus };

const NO_TURNS: LabosAgentTurn[] = [];

/** The open stream of each chat, by `chatKey`. Module scope, so a stream outlives the panel and Stop still works. */
const streams = new Map<string, AbortController>();

/** The text the panel shows for an error code. Plain words, no codes. */
export function errorText(code: LabosAgentChatErrorCode, retryAfterSeconds?: number): string {
  switch (code) {
    case 'UNAUTHORIZED':
      return 'Sign in again to use the agent.';
    case 'AGENT_NOT_ENABLED':
      return 'The agent is not on for your account yet.';
    case 'NEWS_NOT_FOUND':
      return 'The agent cannot find this news story.';
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
        startedAt: Date.now(),
      };
      updateTurns(key, (prev) => (replaceId ? prev.map((t) => (t.id === replaceId ? turn : t)) : [...prev, turn]));
      const threadId = useLabosAgentStore.getState().chats[key].threadId;
      analytics.onAgentMessageSent({ page, textLength: message.length, isRetry: !!replaceId });

      const controller = new AbortController();
      streams.set(key, controller);
      try {
        const body = await getLabosAgentClient().chat(
          { threadId, chatId: id, message, context: toChatContext(context) },
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
        else
          analytics.onAgentAnswerShown({
            page,
            sourceCount: body.sources.length + body.sourceRefs.length,
            durationMs: Date.now() - turn.startedAt,
          });
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
    [context, key, page, patch, updateTurns],
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

  return { turns, busy, send, retry, stop, newChat };
}
