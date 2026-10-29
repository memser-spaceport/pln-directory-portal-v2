import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Cookies from 'js-cookie';

const submitChat = jest.fn();
const stopChat = jest.fn();
const trackHuskyChatStopBtnClicked = jest.fn();
const trackQuestionEdit = jest.fn();
const trackRegenerate = jest.fn();
const chatState: { object?: any; isLoading: boolean; error?: Error } = { isLoading: false };

jest.mock('@/components/core/mcp-hints/McpHint', () => ({
  McpHint: (props: Record<string, unknown>) => <div data-testid="mcp-hint" data-props={JSON.stringify(props)} />,
}));

jest.mock('@ai-sdk/react', () => ({
  experimental_useObject: () => ({
    object: chatState.object,
    isLoading: chatState.isLoading,
    submit: submitChat,
    error: chatState.error,
    stop: stopChat,
  }),
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
import { getAiSearchCount } from '@/components/core/mcp-hints/aiSearchSessionCount';

const QUESTION = 'Which teams work on storage?';
const answered = [
  {
    id: 'm-1',
    question: QUESTION,
    answer: 'Saturn Grid works on storage.',
    followUpQuestions: ['Who funds Saturn Grid?'],
    sources: [],
    actions: [],
    sql: [],
  },
];

const field = () => screen.getByPlaceholderText('Go ahead, ask anything!') as HTMLTextAreaElement;
const hintProps = () => JSON.parse(screen.getByTestId('mcp-hint').getAttribute('data-props')!);

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

describe('AI Search: MCP hint (LAB-3033)', () => {
  it('passes the latest question to the search hint and counts each question sent in the session', async () => {
    render(<Chat isOwnThread id="thread-1" isLoggedIn initialMessages={answered} />);
    expect(hintProps()).toEqual({ context: 'search', query: QUESTION });
    expect(getAiSearchCount()).toBe(0);

    fireEvent.change(field(), { target: { value: 'Who funds Saturn Grid?' } });
    fireEvent.keyDown(field(), { key: 'Enter' });
    await waitFor(() => expect(submitChat).toHaveBeenCalledTimes(1));
    expect(getAiSearchCount()).toBe(1);
    expect(hintProps()).toEqual({ context: 'search', query: 'Who funds Saturn Grid?' });

    fireEvent.change(field(), { target: { value: 'And who else?' } });
    fireEvent.keyDown(field(), { key: 'Enter' });
    await waitFor(() => expect(submitChat).toHaveBeenCalledTimes(2));
    expect(getAiSearchCount()).toBe(2);
    expect(hintProps()).toEqual({ context: 'search', query: 'And who else?' });
  });

  it('sits under the answer, right above the follow-up field', () => {
    render(<Chat isOwnThread id="thread-1" isLoggedIn initialMessages={answered} />);
    const answer = screen.getByText('Saturn Grid works on storage.');
    const hint = screen.getByTestId('mcp-hint');
    expect(answer.compareDocumentPosition(hint) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(hint.compareDocumentPosition(field()) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(hint.closest('form')).toBe(field().closest('form'));
  });
});
