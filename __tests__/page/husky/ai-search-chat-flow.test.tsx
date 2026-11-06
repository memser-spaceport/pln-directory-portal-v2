import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Cookies from 'js-cookie';

const submitChat = jest.fn();
const stopChat = jest.fn();
const trackHuskyChatStopBtnClicked = jest.fn();
const trackQuestionEdit = jest.fn();
const trackRegenerate = jest.fn();
const chatState: { object?: any; isLoading: boolean; error?: Error } = { isLoading: false };

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

const renderChat = (props: Partial<React.ComponentProps<typeof Chat>> = {}) => {
  const allProps = { id: 'thread-1', isLoggedIn: true, userInfo: {} as any, initialMessages: answered, ...props };
  const view = render(<Chat isOwnThread {...allProps} />);
  return { ...view, rerenderChat: () => view.rerender(<Chat isOwnThread {...allProps} />) };
};

const field = () => screen.getByPlaceholderText('Go ahead, ask anything!') as HTMLTextAreaElement;

const typeAndSend = (text: string) => {
  fireEvent.change(field(), { target: { value: text } });
  fireEvent.keyDown(field(), { key: 'Enter' });
};

const questionHeadings = (text: string) => screen.queryAllByRole('heading', { level: 2, name: text });

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

describe('AI Search chat: asking and streaming', () => {
  it('adds the typed question to the thread, clears the field and sends it on the open thread', async () => {
    renderChat();

    typeAndSend('Who funds Saturn Grid?');

    await waitFor(() => expect(submitChat).toHaveBeenCalled());
    expect(submitChat.mock.calls[0][0]).toMatchObject({
      threadId: 'thread-1',
      question: 'Who funds Saturn Grid?',
      directoryId: 'member-1',
    });
    expect(questionHeadings('Who funds Saturn Grid?')).toHaveLength(1);
    expect(field().value).toBe('');
  });

  it('shows the streamed answer and lets the member stop it', async () => {
    const { rerenderChat } = renderChat();
    typeAndSend('Who funds Saturn Grid?');
    await waitFor(() => expect(submitChat).toHaveBeenCalled());
    expect(screen.queryByRole('button', { name: 'Stop answering' })).not.toBeInTheDocument();

    chatState.object = { content: 'Protocol Labs funds it.', followUpQuestions: [] };
    chatState.isLoading = true;
    rerenderChat();

    expect(await screen.findByText('Protocol Labs funds it.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Stop answering' }));

    expect(stopChat).toHaveBeenCalledTimes(1);
    expect(trackHuskyChatStopBtnClicked).toHaveBeenCalledWith('Who funds Saturn Grid?');
  });

  it('shows an error on the new answer when the stream fails, and keeps earlier answers', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    const { rerenderChat } = renderChat();
    typeAndSend('Who funds Saturn Grid?');
    await waitFor(() => expect(submitChat).toHaveBeenCalled());

    chatState.error = new Error('stream failed');
    rerenderChat();

    expect(
      await screen.findByText('Something went wrong, we are unable to provide a response. Please try again later'),
    ).toBeInTheDocument();
    expect(screen.getByText('Saturn Grid works on storage.')).toBeInTheDocument();
    expect(screen.queryByTitle('Copy response')).toBeInTheDocument();
  });
});

describe('AI Search chat: actions on the answer', () => {
  it('regenerates by asking the same question again as a new message', async () => {
    renderChat();

    fireEvent.click(screen.getByTitle('Regenerate response'));

    await waitFor(() => expect(submitChat).toHaveBeenCalled());
    expect(submitChat.mock.calls[0][0]).toMatchObject({ threadId: 'thread-1', question: QUESTION });
    expect(submitChat.mock.calls[0][0].chatId).not.toBe('m-1');
    expect(questionHeadings(QUESTION)).toHaveLength(2);
    expect(trackRegenerate).toHaveBeenCalled();
  });

  it('does not regenerate while an answer streams', async () => {
    chatState.isLoading = true;
    renderChat();

    fireEvent.click(screen.getByTitle('Regenerate response'));
    await act(async () => {});

    expect(submitChat).not.toHaveBeenCalled();
  });

  it('puts the question back in the field for editing', () => {
    renderChat();
    act(() => field().blur());

    fireEvent.click(screen.getByTitle('Edit question'));

    expect(field().value).toBe(QUESTION);
    expect(field()).toHaveFocus();
    expect(screen.getByRole('button', { name: 'Send' })).toBeEnabled();
    expect(trackQuestionEdit).toHaveBeenCalledWith(QUESTION);
  });

  it('does not edit while an answer streams', () => {
    chatState.isLoading = true;
    renderChat();

    fireEvent.click(screen.getByTitle('Edit question'));

    expect(field().value).toBe('');
    expect(trackQuestionEdit).not.toHaveBeenCalled();
  });

  it('asks a clicked follow-up, and ignores another click while its answer is pending', async () => {
    renderChat();

    fireEvent.click(screen.getByText('Who funds Saturn Grid?'));
    await waitFor(() => expect(submitChat).toHaveBeenCalled());
    fireEvent.click(screen.getAllByText('Who funds Saturn Grid?')[0]);
    await act(async () => {});

    expect(submitChat).toHaveBeenCalledTimes(1);
    expect(submitChat.mock.calls[0][0]).toMatchObject({ threadId: 'thread-1', question: 'Who funds Saturn Grid?' });
    expect(questionHeadings('Who funds Saturn Grid?')).toHaveLength(1);
  });
});

describe('AI Search chat: a question handed over by another page', () => {
  it('asks it on mount, shows it in the thread and clears the handoff', async () => {
    localStorage.setItem('input', 'Who builds on IPFS?');

    renderChat({ id: undefined, initialMessages: [], setInitialMessages: jest.fn() });

    expect(await screen.findByRole('heading', { level: 2, name: 'Who builds on IPFS?' })).toBeInTheDocument();
    expect(localStorage.getItem('input')).toBeNull();
    await waitFor(() => expect(submitChat).toHaveBeenCalledTimes(1));
    expect(submitChat.mock.calls[0][0]).toMatchObject({ question: 'Who builds on IPFS?' });
  });
});

describe('AI Search chat: signed-out daily limit', () => {
  beforeEach(() => {
    Cookies.remove('sessionExpiresAt');
  });

  it('refuses the question past the limit and shows the limit strip', async () => {
    Cookies.set('dailyChats', '10');
    renderChat({ isLoggedIn: false });

    typeAndSend('Who funds Saturn Grid?');

    expect(await screen.findByText('Limit reached')).toBeInTheDocument();
    expect(screen.getByText("You've used all free requests for today!")).toBeInTheDocument();
    expect(submitChat).not.toHaveBeenCalled();
    expect(questionHeadings('Who funds Saturn Grid?')).toHaveLength(0);
    expect(Cookies.get('dailyChats')).toBe('11');
  });

  it('asks and shows how many requests remain when few are left', async () => {
    Cookies.set('dailyChats', '7');
    renderChat({ isLoggedIn: false });

    typeAndSend('Who funds Saturn Grid?');

    expect(await screen.findByText('2 requests remaining')).toBeInTheDocument();
    expect(screen.getByText('You are running out of free requests!')).toBeInTheDocument();
    expect(submitChat).toHaveBeenCalledTimes(1);
    expect(submitChat.mock.calls[0][0]).not.toHaveProperty('directoryId');
  });

  it('asks the last free question and shows the limit strip with it', async () => {
    Cookies.set('dailyChats', '9');
    renderChat({ isLoggedIn: false });

    typeAndSend('Who funds Saturn Grid?');

    expect(await screen.findByText('Limit reached')).toBeInTheDocument();
    expect(submitChat).toHaveBeenCalledTimes(1);
    expect(questionHeadings('Who funds Saturn Grid?')).toHaveLength(1);
  });

  it('shows no strip with plenty of requests left', async () => {
    renderChat({ isLoggedIn: false });

    typeAndSend('Who funds Saturn Grid?');

    await waitFor(() => expect(submitChat).toHaveBeenCalled());
    expect(screen.queryByText('Limit reached')).not.toBeInTheDocument();
    expect(screen.queryByText(/requests? remaining/)).not.toBeInTheDocument();
  });
});
