'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { experimental_useObject as useObject } from '@ai-sdk/react';
import { useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';

import { useHuskyAnalytics } from '@/analytics/husky.analytics';
import { toast } from '@/components/core/ToastContainer';
import { createHuskyThread, createThreadTitle } from '@/services/husky.service';
import { SearchQueryKeys } from '@/services/search/constants';
import { getUserCredentials } from '@/utils/auth.utils';
import { generateUUID, getUniqueId } from '@/utils/common.utils';
import { TOAST_MESSAGES } from '@/utils/constants';
import { useDailyChatLimit, type LimitLevel } from './useDailyChatLimit';

/* The wire shape, declared once. Everything downstream derives from it rather
   than restating it — the previous two hosts each kept their own copy of this
   schema *and* their own `any[]` for the messages it produced. */
const huskyChatSchema = z.object({
  content: z.string(),
  followUpQuestions: z.array(z.string()),
  sources: z.array(z.string()).optional(),
  actions: z
    .array(
      z.object({
        name: z.string(),
        directoryLink: z.string(),
        type: z.string(),
      }),
    )
    .optional(),
});

export type HuskyChunk = z.infer<typeof huskyChatSchema>;
export type HuskyAction = NonNullable<HuskyChunk['actions']>[number];

export interface HuskyTurn {
  /** Identity, so a chunk can only ever land on the turn that asked for it. */
  chatId: string;
  question: string;
  answer: string;
  sources: string[];
  followUpQuestions: string[];
  actions: HuskyAction[];
  isError?: boolean;
}

export interface HuskySubmitParams {
  threadId: string;
  chatId: string;
  question: string;
  name?: string;
  email?: string;
  directoryId?: string;
}

/**
 * `'submitting'` is the state that did not exist before, and its absence *was*
 * the double-submit bug: everything between the click and the first `setState`
 * looked identical to idle.
 */
export type StreamStatus = 'idle' | 'submitting' | 'streaming' | 'stopped' | 'errored' | 'done';

/** What a live stream is allowed to write into. */
interface ActiveStream {
  threadId: string;
  chatId: string;
  canceled: boolean;
}

const THREAD_STORAGE_KEY = 'aiSearchThreadId';

interface Options {
  isLoggedIn: boolean;
  /** Read-only shared threads (`/husky/chat/[id]` viewed by a non-owner). */
  isOwnThread?: boolean;
  /** Where the thread was started, for analytics and host-specific params. */
  from?: string;
  /** Host-specific additions to the request body, e.g. the blog chat summary. */
  buildSubmitParams?: (base: HuskySubmitParams) => Record<string, unknown>;
}

/**
 * The AI Search conversation, hoisted out of the dialog that used to own it.
 *
 * Mounted once, high enough to outlive the sheet, so closing the dialog keeps
 * the thread — for signed-out users too, who have no history list to recover it
 * from. That lifetime is also what makes the correctness work below necessary:
 * a stream that used to die with its modal now outlives navigation, thread
 * switches and everything else the person does next.
 *
 * Named for the domain rather than for this dialog on purpose: the `/husky/chat`
 * page is a byte-level twin of the code this replaces, and should be able to
 * adopt this without a signature change.
 */
export function useHuskyChat({ isLoggedIn, isOwnThread = true, from, buildSubmitParams }: Options) {
  const [turns, setTurns] = useState<HuskyTurn[]>([]);
  const [status, setStatus] = useState<StreamStatus>('idle');
  const [threadId, setThreadId] = useState<string | null>(null);

  const queryClient = useQueryClient();
  const analytics = useHuskyAnalytics();
  const limit = useDailyChatLimit();

  /* Everything the exposed callbacks close over goes through a ref refreshed
     each render. `useObject`'s `submit` is a fresh function identity on every
     render and both analytics hooks return a fresh object literal, so a
     `useCallback` that listed them would be recreated every render — and a
     `useCallback` with an unstable dependency is not a memo, it is a comment. */
  const latest = useRef({ isLoggedIn, isOwnThread, from, buildSubmitParams, analytics, limit });
  useEffect(() => {
    latest.current = { isLoggedIn, isOwnThread, from, buildSubmitParams, analytics, limit };
  });

  /* Resolved per request inside `fetch`, never at hook construction. The header
     option is read from `submit`'s own render closure, and `getUserCredentials`
     is async — so there is no render in which an awaited token could reach it.
     A ref's identity never changes, so this cannot go stale however old the
     closure that calls it is. */
  const tokenRef = useRef<string | null>(null);

  /* Synchronous, because the double-submit window opens *before* the first
     setState: two presses 300ms apart both read `status === 'idle'`, both await
     `getUserCredentials`, both submit. React state cannot close a window that
     opens before React is involved. */
  const inFlightRef = useRef(false);
  const activeStreamRef = useRef<ActiveStream | null>(null);
  const threadIdRef = useRef<string | null>(null);
  const turnsRef = useRef<HuskyTurn[]>([]);

  useEffect(() => {
    turnsRef.current = turns;
  }, [turns]);

  const {
    object: chatObject,
    isLoading: chatIsLoading,
    submit: submitChat,
    error: chatError,
    stop: stopChat,
  } = useObject<HuskyChunk, HuskySubmitParams>({
    api: `${process.env.DIRECTORY_API_URL}/v1/husky/chat/contextual-tools`,
    headers: { 'Content-Type': 'application/json' },
    fetch: (url, init) =>
      fetch(url, {
        ...init,
        headers: {
          ...init?.headers,
          ...(tokenRef.current ? { Authorization: `Bearer ${tokenRef.current}` } : {}),
        },
      }),
    schema: huskyChatSchema,
    onFinish: () => {
      inFlightRef.current = false;
      if (activeStreamRef.current && !activeStreamRef.current.canceled) {
        activeStreamRef.current = null;
        setStatus('done');
      }
    },
    onError: (error) => {
      console.error('AI Search stream failed', error);
      inFlightRef.current = false;
    },
  });

  /* The id of the thread a reload interrupted. The answer itself is already
     persisted server-side (the backend writes it from its own stream, not from
     the client's connection), so the id is the only thing a reload loses — and
     without it a signed-out person has no way back to their own conversation at
     all. Read on demand rather than restored into state on mount: an id with no
     turns behind it is only useful to a caller that is about to fetch them. */
  const getInterruptedThreadId = useCallback((): string | null => {
    try {
      return sessionStorage.getItem(THREAD_STORAGE_KEY);
    } catch {
      return null; // Private mode, blocked storage — simply not restorable.
    }
  }, []);

  const rememberThreadId = useCallback((id: string | null) => {
    threadIdRef.current = id;
    setThreadId(id);
    try {
      if (id) sessionStorage.setItem(THREAD_STORAGE_KEY, id);
      else sessionStorage.removeItem(THREAD_STORAGE_KEY);
    } catch {
      // See above.
    }
  }, []);

  /** Abandon whatever is streaming. Every path that walks away calls this. */
  const abandonStream = useCallback(() => {
    if (activeStreamRef.current) activeStreamRef.current.canceled = true;
    activeStreamRef.current = null;
    inFlightRef.current = false;
    stopChat();
  }, [stopChat]);

  /**
   * Stop, as the user's action.
   *
   * The SDK's own `stop()` aborts and flips its internal loading flag, but
   * `onFinish` fires only from the stream's natural close — so aborting before
   * the first chunk left the host's loading flag set forever. On a hook that
   * never unmounts, that is not a stuck spinner: it is every guard reading that
   * flag silently ignoring the user, on every page, until they reload.
   */
  const stop = useCallback(() => {
    abandonStream();
    setStatus('stopped');
  }, [abandonStream]);

  /* Fold chunks into the turn that asked for them.
     The old fold wrote `messages[messages.length - 1]` — positional, so a
     superseded stream landed on whatever happened to be last, including the
     final turn of a saved conversation someone was calmly reading. */
  useEffect(() => {
    const active = activeStreamRef.current;
    if (!active || active.canceled) return;
    if (active.threadId !== threadIdRef.current) return;
    if (!chatObject?.content) return;

    /* eslint-disable-next-line react-hooks/set-state-in-effect --
       `chatObject` is a network stream surfacing through useObject, not React
       state; folding its chunks into turns is exactly the "subscribe to an
       external system" case. There is no render-time derivation available:
       turns accumulate across streams, and a superseded stream must be dropped
       by identity rather than recomputed. */
    setStatus((prev) => (prev === 'submitting' ? 'streaming' : prev));
    // eslint-disable-next-line react-hooks/set-state-in-effect -- see above
    setTurns((prev) =>
      prev.map((turn) =>
        turn.chatId === active.chatId
          ? {
              ...turn,
              answer: chatObject.content ?? turn.answer,
              followUpQuestions: (chatObject.followUpQuestions?.filter(Boolean) as string[]) ?? turn.followUpQuestions,
              sources: (chatObject.sources?.filter(Boolean) as string[]) ?? turn.sources,
              actions: (chatObject.actions?.filter(Boolean) as HuskyAction[]) ?? turn.actions,
            }
          : turn,
      ),
    );
  }, [chatObject, chatIsLoading]);

  /* The error branch gets the same identity check. Without it, a stream that
     failed after the user moved on marks someone else's turn as broken. And the
     partial answer is kept: the old code set `answer: ''`, throwing away
     everything that had already arrived. */
  useEffect(() => {
    if (!chatError) return;
    const active = activeStreamRef.current;
    if (!active || active.canceled) return;
    if (active.threadId !== threadIdRef.current) return;

    activeStreamRef.current = null;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- external stream, see the fold effect above
    setStatus('errored');
    // eslint-disable-next-line react-hooks/set-state-in-effect -- external stream, see the fold effect above
    setTurns((prev) => prev.map((turn) => (turn.chatId === active.chatId ? { ...turn, isError: true } : turn)));
  }, [chatError]);

  /* `useObject` has no unmount cleanup of its own, so without this a stream
     outlives the hook and writes into a dead SWR key. */
  useEffect(() => () => abandonStream(), [abandonStream]);

  const send = useCallback(
    async (question: string, { newThread }: { newThread: boolean }) => {
      const trimmed = question.trim();
      if (!trimmed) return;
      if (!latest.current.isOwnThread) return;

      /* Starting a new conversation supersedes whatever is running — that is
         what the AI row does while an answer is on screen. A *follow-up* is
         refused instead: two questions in one thread would fold into each
         other, and the in-flight ref is what closes that window, because it
         opens before React is involved. */
      if (newThread) abandonStream();
      else if (inFlightRef.current) return;

      /* Refuse before spending anything. The count used to be consumed first
         and the refusal returned after, which cost the user both their question
         and one of their ten. */
      if (!latest.current.limit.consume()) return;

      inFlightRef.current = true;
      setStatus('submitting');

      const nextThreadId = newThread || !threadIdRef.current ? getUniqueId() : threadIdRef.current;
      const isFirstTurn = newThread || turnsRef.current.length === 0;
      const chatId = generateUUID();

      if (newThread) setTurns([]);
      rememberThreadId(nextThreadId);
      activeStreamRef.current = { threadId: nextThreadId, chatId, canceled: false };

      setTurns((prev) => [
        ...(newThread ? [] : prev),
        { chatId, question: trimmed, answer: '', sources: [], followUpQuestions: [], actions: [] },
      ]);

      try {
        const { authToken, userInfo } = await getUserCredentials(latest.current.isLoggedIn);
        tokenRef.current = authToken ?? null;

        /* A stream abandoned while we were awaiting credentials must not start. */
        if (activeStreamRef.current?.chatId !== chatId || activeStreamRef.current.canceled) return;

        const base: HuskySubmitParams = {
          threadId: nextThreadId,
          chatId,
          question: trimmed,
          ...(userInfo?.name && { name: userInfo.name }),
          ...(userInfo?.email && { email: userInfo.email }),
          ...(userInfo?.uid && { directoryId: userInfo.uid }),
        };
        const params = (latest.current.buildSubmitParams?.(base) ?? base) as HuskySubmitParams;

        latest.current.analytics.trackAiResponse('initiated', 'user-input', false, trimmed);

        /* Submit first. Thread registration used to be awaited *before* this,
           so an expired token made `createHuskyThread` return false and the
           question was never sent at all — no error, no toast, a spinner that
           never resolved. Registration is bookkeeping: if it fails the answer
           still arrives, the thread simply won't be listed in history. */
        submitChat(params);
        latest.current.analytics.trackAiResponse('success', 'user-input', false, trimmed);

        if (latest.current.isLoggedIn && authToken && isFirstTurn) {
          void (async () => {
            try {
              const created = await createHuskyThread(authToken, nextThreadId);
              if (!created) return;
              await createThreadTitle(authToken, nextThreadId, trimmed);
              queryClient.invalidateQueries({ queryKey: [SearchQueryKeys.GET_AI_CHAT_HISTORY] });
            } catch (error) {
              console.error('AI Search thread registration failed', error);
            }
          })();
        }
      } catch (error) {
        console.error('AI Search submission failed', error);
        toast.error(TOAST_MESSAGES.AI_CHAT_FAILED);
        latest.current.analytics.trackAiResponse('error', 'user-input', false, trimmed);
        inFlightRef.current = false;
        activeStreamRef.current = null;
        setStatus('errored');
      }
    },
    [abandonStream, queryClient, rememberThreadId, submitChat],
  );

  /** A new conversation. Always a new thread — never a turn appended to the
   *  last one, which is what the old id-reuse rule produced once the hook
   *  outlived the dialog. */
  const startThread = useCallback((question: string) => send(question, { newThread: true }), [send]);

  /** A follow-up in the open conversation. */
  const ask = useCallback((question: string) => send(question, { newThread: false }), [send]);

  const regenerate = useCallback(
    (question: string) => {
      abandonStream();
      return send(question, { newThread: false });
    },
    [abandonStream, send],
  );

  /** Load a conversation that already exists — from history, or a server render. */
  const hydrate = useCallback(
    (nextTurns: HuskyTurn[], nextThreadId: string) => {
      abandonStream();
      setTurns(nextTurns);
      rememberThreadId(nextThreadId);
      setStatus(nextTurns.length ? 'done' : 'idle');
    },
    [abandonStream, rememberThreadId],
  );

  const reset = useCallback(() => {
    abandonStream();
    setTurns([]);
    rememberThreadId(null);
    setStatus('idle');
  }, [abandonStream, rememberThreadId]);

  const isBusy = status === 'submitting' || status === 'streaming';

  return {
    turns,
    threadId,
    status,
    isBusy,
    limitLevel: limit.level as LimitLevel,
    limitRemaining: limit.remaining,
    refreshLimit: limit.refresh,
    startThread,
    ask,
    regenerate,
    hydrate,
    stop,
    reset,
    getInterruptedThreadId,
  };
}
