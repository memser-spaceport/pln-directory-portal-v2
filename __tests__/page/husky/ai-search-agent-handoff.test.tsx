import { act, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Cookies from 'js-cookie';

import { AI_SEARCH_PENDING_QUESTIONS_KEY_PREFIX } from '@/components/constants/aiSearchHandoff';

const submitChat = jest.fn();
const stopChat = jest.fn();
const trackHuskyChatStopBtnClicked = jest.fn();
const trackQuestionEdit = jest.fn();
const trackRegenerate = jest.fn();
const chatState: { object?: any; isLoading: boolean; error?: Error } = { isLoading: false };
/* The options Chat passes to `useObject`, so a test can call `onError` as the SDK does. */
const chatOptions: { current?: { onError?: (error: Error) => void } } = {};

jest.mock('@ai-sdk/react', () => ({
  experimental_useObject: (options: { onError?: (error: Error) => void }) => {
    chatOptions.current = options;
    return {
      object: chatState.object,
      isLoading: chatState.isLoading,
      submit: submitChat,
      error: chatState.error,
      stop: stopChat,
    };
  },
}));
jest.mock('@/utils/auth.utils', () => ({
  getUserCredentials: async (isLoggedIn: boolean) => ({
    authToken: isLoggedIn ? 'member-jwt' : null,
    userInfo: isLoggedIn ? { uid: 'member-1', name: 'Member One', email: 'member@example.test' } : null,
  }),
}));
jest.mock('@/services/husky.service', () => ({
  createHuskyThread: jest.fn(() => Promise.resolve(true)),
  createThreadTitle: jest.fn(() => Promise.resolve(null)),
  duplicateThread: jest.fn(),
}));
jest.mock('@/analytics/husky.analytics', () => ({
  useHuskyAnalytics: () =>
    new Proxy(
      { trackHuskyChatStopBtnClicked, trackQuestionEdit, trackRegenerate },
      { get: (target: any, key) => target[key] ?? jest.fn() },
    ),
}));
jest.mock('@/analytics/unified-search.analytics', () => ({
  useUnifiedSearchAnalytics: () => ({ onAiQuerySubmitted: jest.fn() }),
}));
jest.mock('@/components/core/ToastContainer', () => ({ toast: { error: jest.fn(), info: jest.fn() } }));
jest.mock('@/components/core/login/utils', () => ({ useLoginRedirect: () => jest.fn() }));
jest.mock('@/services/discovery.service', () => ({ getChatQuestions: jest.fn(() => Promise.resolve({ data: [] })) }));
jest.mock('@/components/core/husky/husky-code-block', () => ({
  __esModule: true,
  default: ({ children }: { children?: React.ReactNode }) => <code>{children}</code>,
}));
jest.mock('@/components/page/husky/hooks/useSidebar', () => ({
  useSidebar: () => ({ toggleSidebar: jest.fn(), state: 'expanded', isMobile: false }),
}));

import { Chat } from '@/components/page/husky/Chat';
import { createHuskyThread, createThreadTitle } from '@/services/husky.service';

/*
 * LAB-3429: "AI agent chat" in the LabOS agent saves a new thread and leaves its questions in localStorage under
 * `ai-search-pending-questions:<threadId>`. The new tab opens `/ai-search/<threadId>` and asks them one at a time.
 */
const THREAD = 'agent-thread-1';
const KEY = AI_SEARCH_PENDING_QUESTIONS_KEY_PREFIX + THREAD;
const Q1 = 'About Maya Okonkwo (http://localhost/members/m-1): What is she working on?';
const Q2 = 'Which teams does she work with?';

const renderThread = (props: Partial<React.ComponentProps<typeof Chat>> = {}) => {
  const allProps = { id: THREAD, isLoggedIn: true, initialMessages: [], from: 'detail', isOwnThread: true, ...props };
  const view = render(<Chat {...allProps} />);
  return { ...view, rerenderThread: () => view.rerender(<Chat {...allProps} />) };
};

/** The streamed answer arrives, then the stream ends. */
const answer = (text: string, rerender: () => void) => {
  chatState.object = { content: text, followUpQuestions: [] };
  chatState.isLoading = true;
  rerender();
  chatState.isLoading = false;
  rerender();
};

beforeEach(() => {
  jest.clearAllMocks();
  chatState.object = undefined;
  chatState.isLoading = false;
  chatState.error = undefined;
  localStorage.clear();
  sessionStorage.clear();
  Cookies.remove('dailyChats');
  Cookies.set('sessionExpiresAt', '2000000000');
});

describe('LAB-3429: AI agent chat asks the questions handed over by the agent', () => {
  it('asks the first question on the saved thread, without creating the thread again, and removes the key', async () => {
    localStorage.setItem(KEY, JSON.stringify([Q1, Q2]));
    renderThread();

    await waitFor(() => expect(submitChat).toHaveBeenCalledTimes(1));
    expect(submitChat.mock.calls[0][0]).toMatchObject({ threadId: THREAD, question: Q1 });
    expect(createHuskyThread).not.toHaveBeenCalled();
    expect(createThreadTitle).not.toHaveBeenCalled();
    expect(localStorage.getItem(KEY)).toBeNull();
    expect(screen.getByRole('heading', { level: 2, name: Q1 })).toBeInTheDocument();
  });

  it('asks the next question only after the answer before it has finished, on the same thread', async () => {
    localStorage.setItem(KEY, JSON.stringify([Q1, Q2]));
    const { rerenderThread } = renderThread();
    await waitFor(() => expect(submitChat).toHaveBeenCalledTimes(1));

    // Still streaming: the second question waits.
    chatState.object = { content: 'She works on', followUpQuestions: [] };
    chatState.isLoading = true;
    rerenderThread();
    await new Promise((r) => setTimeout(r, 0));
    expect(submitChat).toHaveBeenCalledTimes(1);

    chatState.object = { content: 'She works on storage.', followUpQuestions: [] };
    chatState.isLoading = false;
    rerenderThread();

    await waitFor(() => expect(submitChat).toHaveBeenCalledTimes(2));
    expect(submitChat.mock.calls[1][0]).toMatchObject({ threadId: THREAD, question: Q2 });
    expect(createHuskyThread).not.toHaveBeenCalled();

    // Nothing is left to ask.
    answer('Saturn Grid.', rerenderThread);
    await new Promise((r) => setTimeout(r, 0));
    expect(submitChat).toHaveBeenCalledTimes(2);
  });

  it('a failed answer does not stop the questions after it', async () => {
    localStorage.setItem(KEY, JSON.stringify([Q1, Q2]));
    const { rerenderThread } = renderThread();
    await waitFor(() => expect(submitChat).toHaveBeenCalledTimes(1));

    const error = new Error('stream failed');
    chatState.error = error;
    act(() => chatOptions.current?.onError?.(error));
    rerenderThread();

    await waitFor(() => expect(submitChat).toHaveBeenCalledTimes(2));
    expect(submitChat.mock.calls[1][0]).toMatchObject({ threadId: THREAD, question: Q2 });
  });

  it("does not ask the questions on someone else's thread, and leaves the key", async () => {
    localStorage.setItem(KEY, JSON.stringify([Q1]));
    renderThread({ isOwnThread: false });
    await new Promise((r) => setTimeout(r, 0));

    expect(submitChat).not.toHaveBeenCalled();
    expect(localStorage.getItem(KEY)).not.toBeNull();
  });

  it('a broken entry asks nothing and is removed', async () => {
    localStorage.setItem(KEY, '{not json');
    renderThread();
    await new Promise((r) => setTimeout(r, 0));

    expect(submitChat).not.toHaveBeenCalled();
    expect(localStorage.getItem(KEY)).toBeNull();
  });
});
