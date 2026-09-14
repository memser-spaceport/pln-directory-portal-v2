import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';

/**
 * The engine's tests, and the reason it is a hook rather than a component:
 * every one of these is a silent failure — nothing throws, nothing logs, the
 * UI simply does the wrong thing. They are also the tests that could not have
 * been written against the old code, where counting, gating, streaming and
 * thread bookkeeping all lived in one function inside a panel.
 */

/* A controllable stand-in for the AI SDK's stream. The real one re-renders its
   host on every chunk, so the fake has to be able to as well. */
const stream: {
  object: unknown;
  isLoading: boolean;
  error: Error | undefined;
  submit: jest.Mock;
  stop: jest.Mock;
  force?: () => void;
  onFinish?: (e: unknown) => void;
  onError?: (e: Error) => void;
} = {
  object: undefined,
  isLoading: false,
  error: undefined,
  submit: jest.fn(),
  stop: jest.fn(),
};

jest.mock('@ai-sdk/react', () => ({
  experimental_useObject: function useObjectStub(opts: {
    onFinish?: (e: unknown) => void;
    onError?: (e: Error) => void;
  }) {
    const [, force] = React.useReducer((x: number) => x + 1, 0);
    stream.force = force;
    stream.onFinish = opts.onFinish;
    stream.onError = opts.onError;
    return {
      object: stream.object,
      isLoading: stream.isLoading,
      error: stream.error,
      submit: stream.submit,
      stop: stream.stop,
    };
  },
}));

const getUserCredentials = jest.fn();
jest.mock('@/utils/auth.utils', () => ({
  getUserCredentials: (...args: unknown[]) => getUserCredentials(...args),
}));

const createHuskyThread = jest.fn();
const createThreadTitle = jest.fn();
jest.mock('@/services/husky.service', () => ({
  createHuskyThread: (...args: unknown[]) => createHuskyThread(...args),
  createThreadTitle: (...args: unknown[]) => createThreadTitle(...args),
}));

const checkRefreshToken = jest.fn();
const getChatCount = jest.fn();
const updateChatCount = jest.fn();
jest.mock('@/utils/husky.utlils', () => ({
  checkRefreshToken: () => checkRefreshToken(),
  getChatCount: () => getChatCount(),
  updateChatCount: () => updateChatCount(),
}));

jest.mock('@/analytics/husky.analytics', () => ({
  useHuskyAnalytics: () => ({ trackAiResponse: jest.fn() }),
}));

jest.mock('@/components/core/ToastContainer', () => ({
  toast: { error: jest.fn() },
}));

import { useHuskyChat } from '@/services/husky/hooks/useHuskyChat';

/** Push a streamed chunk at whatever the hook currently considers active. */
function emit(object: unknown) {
  act(() => {
    stream.object = object;
    stream.isLoading = true;
    stream.force?.();
  });
}

function emitError(error: Error) {
  act(() => {
    stream.error = error;
    stream.force?.();
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  stream.object = undefined;
  stream.isLoading = false;
  stream.error = undefined;
  getUserCredentials.mockResolvedValue({ authToken: 'token', userInfo: { uid: 'u1', name: 'A', email: 'a@b.c' } });
  createHuskyThread.mockResolvedValue(true);
  createThreadTitle.mockResolvedValue(true);
  checkRefreshToken.mockReturnValue(true); // signed in — unlimited
  getChatCount.mockReturnValue(0);
  sessionStorage.clear();
});

describe('useHuskyChat', () => {
  it('sends one request when two asks land inside the credentials await window', async () => {
    // The window that made this possible opens *before* the first setState, so
    // no state-derived `disabled` could ever have closed it.
    let release: (value: unknown) => void = () => {};
    getUserCredentials.mockReturnValue(new Promise((resolve) => (release = resolve)));

    const { result } = renderHook(() => useHuskyChat({ isLoggedIn: true }));

    await act(async () => {
      result.current.startThread('filecoin teams');
      result.current.startThread('filecoin teams');
      release({ authToken: 'token', userInfo: {} });
    });

    await waitFor(() => expect(stream.submit).toHaveBeenCalledTimes(1));
  });

  it('still submits when thread registration fails', async () => {
    // Registration used to be awaited first, so a false here meant the question
    // was never sent at all — and nothing threw.
    createHuskyThread.mockResolvedValue(false);

    const { result } = renderHook(() => useHuskyChat({ isLoggedIn: true }));
    await act(async () => {
      await result.current.startThread('who works on zk');
    });

    expect(stream.submit).toHaveBeenCalledTimes(1);
    expect(createThreadTitle).not.toHaveBeenCalled();
    /* ...and the thread must not claim to be linkable. Registration is the only
       thing that creates the document `/husky/chat/<id>` reads, so a failure
       here has to reach anything that offers to navigate there — otherwise the
       reader is handed a URL the route can only answer with notFound(). */
    expect(result.current.isThreadPersisted).toBe(false);
  });

  /**
   * `threadId` is generated on the client, so it is a truthy string from the
   * first answer onwards and cannot stand in for "the backend has this thread".
   */
  describe('whether the thread can be linked to', () => {
    it('says no before anything has been asked', () => {
      const { result } = renderHook(() => useHuskyChat({ isLoggedIn: true }));

      expect(result.current.isThreadPersisted).toBe(false);
    });

    it('says yes once registration succeeds', async () => {
      createHuskyThread.mockResolvedValue(true);

      const { result } = renderHook(() => useHuskyChat({ isLoggedIn: true }));
      await act(async () => {
        await result.current.startThread('who works on zk');
      });

      await waitFor(() => expect(result.current.isThreadPersisted).toBe(true));
      expect(result.current.threadId).toEqual(expect.any(String));
    });

    // Registration only runs for a signed-in member, so this is not an edge
    // case: signed out, the link could never have resolved.
    it('says no for a signed-out visitor, who registers nothing', async () => {
      createHuskyThread.mockResolvedValue(true);
      getUserCredentials.mockResolvedValue({ authToken: null, userInfo: undefined });

      const { result } = renderHook(() => useHuskyChat({ isLoggedIn: false }));
      await act(async () => {
        await result.current.startThread('who works on zk');
      });

      expect(createHuskyThread).not.toHaveBeenCalled();
      expect(result.current.isThreadPersisted).toBe(false);
    });

    it('says yes for a thread read back from the server', () => {
      const { result } = renderHook(() => useHuskyChat({ isLoggedIn: true }));

      act(() => {
        result.current.hydrate(
          [{ chatId: 'c1', question: 'q', answer: 'a', sources: [], followUpQuestions: [], actions: [] }],
          'thread-from-history',
        );
      });

      expect(result.current.isThreadPersisted).toBe(true);
    });

    // A second search reuses nothing: the new id has no document behind it
    // until its own registration lands.
    it('says no again the moment a new thread starts', async () => {
      createHuskyThread.mockResolvedValue(true);

      const { result } = renderHook(() => useHuskyChat({ isLoggedIn: true }));
      await act(async () => {
        await result.current.startThread('first');
      });
      await waitFor(() => expect(result.current.isThreadPersisted).toBe(true));

      let release: (value: unknown) => void = () => {};
      getUserCredentials.mockReturnValue(new Promise((resolve) => (release = resolve)));
      act(() => {
        result.current.startThread('second');
      });

      expect(result.current.isThreadPersisted).toBe(false);
      await act(async () => {
        release({ authToken: 'token', userInfo: {} });
      });
    });
  });

  it('accepts a new question after stop()', async () => {
    // onFinish never fires on abort, so the loading flag used to stay set —
    // on a hook that never unmounts, that is a permanent lockout.
    const { result } = renderHook(() => useHuskyChat({ isLoggedIn: true }));

    await act(async () => {
      await result.current.startThread('first');
    });
    act(() => result.current.stop());

    expect(result.current.isBusy).toBe(false);

    await act(async () => {
      await result.current.ask('second');
    });

    expect(stream.submit).toHaveBeenCalledTimes(2);
  });

  it('drops chunks from a stream the user has walked away from', async () => {
    const { result } = renderHook(() => useHuskyChat({ isLoggedIn: true }));

    await act(async () => {
      await result.current.startThread('first');
    });
    act(() => result.current.stop());

    emit({ content: 'an answer to a question nobody is looking at', followUpQuestions: [] });

    expect(result.current.turns).toHaveLength(1);
    expect(result.current.turns[0].answer).toBe('');
  });

  it('keeps a partial answer when the stream errors', async () => {
    const { result } = renderHook(() => useHuskyChat({ isLoggedIn: true }));

    await act(async () => {
      await result.current.startThread('lisbon events');
    });
    emit({ content: 'Half of an ans', followUpQuestions: [] });
    expect(result.current.turns[0].answer).toBe('Half of an ans');

    emitError(new Error('boom'));

    expect(result.current.turns[0].answer).toBe('Half of an ans');
    expect(result.current.turns[0].isError).toBe(true);
  });

  it('refuses a question over the daily quota without spending it or the count', async () => {
    // The old order consumed first and refused after — costing the user their
    // typed question *and* one of their ten.
    checkRefreshToken.mockReturnValue(false); // signed out — quota applies
    getChatCount.mockReturnValue(11); // already past DAILY_CHAT_LIMIT

    const { result } = renderHook(() => useHuskyChat({ isLoggedIn: false }));
    await act(async () => {
      await result.current.startThread('one too many');
    });

    expect(stream.submit).not.toHaveBeenCalled();
    expect(updateChatCount).not.toHaveBeenCalled();
    expect(result.current.limitLevel).toBe('warn');
    expect(result.current.turns).toHaveLength(0);
  });

  it('refuses a follow-up mid-stream but lets a new search supersede it', async () => {
    const { result } = renderHook(() => useHuskyChat({ isLoggedIn: true }));

    await act(async () => {
      await result.current.startThread('first');
    });

    // Same thread, still streaming: refused.
    await act(async () => {
      await result.current.ask('too soon');
    });
    expect(stream.submit).toHaveBeenCalledTimes(1);

    // A new search while an answer is on screen supersedes it — this is what
    // the AI row does from the results list.
    await act(async () => {
      await result.current.startThread('something else');
    });
    expect(stream.submit).toHaveBeenCalledTimes(2);
    expect(result.current.turns).toHaveLength(1);
    expect(result.current.turns[0].question).toBe('something else');
  });

  it('starts a new thread rather than appending to the open one', async () => {
    // checkAndSetThreadId reused the id whenever messages existed. Session-lived,
    // that made a fresh search turn 2 of the previous conversation.
    const { result } = renderHook(() => useHuskyChat({ isLoggedIn: true }));

    await act(async () => {
      await result.current.startThread('first question');
    });
    const firstThreadId = result.current.threadId;

    // A follow-up is only accepted once the first answer is done — two
    // questions in one thread would fold into each other.
    act(() => stream.onFinish?.({}));
    await act(async () => {
      await result.current.ask('a follow up');
    });
    expect(result.current.turns).toHaveLength(2);
    expect(result.current.threadId).toBe(firstThreadId);

    await act(async () => {
      await result.current.startThread('an unrelated search');
    });

    expect(result.current.turns).toHaveLength(1);
    expect(result.current.turns[0].question).toBe('an unrelated search');
    expect(result.current.threadId).not.toBe(firstThreadId);
  });
});
