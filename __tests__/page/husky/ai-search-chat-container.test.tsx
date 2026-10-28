import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Cookies from 'js-cookie';

const submitChat = jest.fn();
const saveFeedback = jest.fn();
const trackMobileHeaderNewConversationClicked = jest.fn();

jest.mock('@ai-sdk/react', () => ({
  experimental_useObject: () => ({
    object: undefined,
    isLoading: false,
    submit: submitChat,
    error: undefined,
    stop: jest.fn(),
  }),
}));
jest.mock('@/utils/auth.utils', () => ({
  getUserCredentials: async (isLoggedIn: boolean) => ({
    authToken: isLoggedIn ? 'member-jwt' : null,
    userInfo: isLoggedIn ? { uid: 'member-1' } : null,
  }),
}));
jest.mock('@/utils/fetch-wrapper', () => ({
  getUserCredentialsInfo: async () => ({ newAuthToken: 'member-jwt', newUserInfo: null }),
}));
jest.mock('@/services/husky.service', () => ({
  createHuskyThread: jest.fn(() => Promise.resolve(true)),
  createThreadTitle: jest.fn(() => Promise.resolve(null)),
  duplicateThread: jest.fn(),
  saveFeedback: (...args: unknown[]) => saveFeedback(...args),
  removeFeedback: jest.fn(),
}));
jest.mock('@/analytics/husky.analytics', () => ({
  useHuskyAnalytics: () =>
    new Proxy({ trackMobileHeaderNewConversationClicked }, { get: (target: any, key) => target[key] ?? jest.fn() }),
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

import { ChatContainer } from '@/components/page/husky/ChatContainer';
import {
  OPEN_VISIT_CHAT_EVENT,
  PENDING_VISIT_CHAT_KEY,
  VISIT_CHATS_STORAGE_KEY,
} from '@/components/page/husky/constants/visitChats';

const HOME_HEADLINE = 'Explore Protocol Labs with AI';

const storedBlogChat = {
  type: 'blog',
  message: {
    id: 'stored-id',
    question: 'What is LabWeek?',
    answer: 'LabWeek is a gathering.',
    followUpQuestions: [],
    sources: ['https://example.com/labweek'],
    actions: [],
    sql: [],
    isError: true,
  },
};

const visitChat = {
  threadId: 'visit-1',
  title: 'Who builds IPFS?',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  messages: [{ id: 'v-1', question: 'Who builds IPFS?', answer: 'Many teams.', followUpQuestions: [] }],
};

const storeVisitChat = () => sessionStorage.setItem(VISIT_CHATS_STORAGE_KEY, JSON.stringify([visitChat]));

const field = () => screen.getByPlaceholderText('Go ahead, ask anything!') as HTMLTextAreaElement;

const typeAndSend = (text: string) => {
  fireEvent.change(field(), { target: { value: text } });
  fireEvent.keyDown(field(), { key: 'Enter' });
};

const renderSignedIn = () => {
  Cookies.set('sessionExpiresAt', '2000000000');
  return render(<ChatContainer isLoggedIn />);
};

const renderSignedOut = () => render(<ChatContainer isLoggedIn={false} />);

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
  sessionStorage.clear();
  Cookies.remove('sessionExpiresAt');
  Cookies.remove('dailyChats');
});

describe('AI Search page: new chat', () => {
  it('opens on the new-chat home', async () => {
    renderSignedOut();

    expect(screen.getByText(HOME_HEADLINE)).toBeInTheDocument();
    await act(async () => {});
  });

  it('asks a question typed on the home and shows it in the thread', async () => {
    renderSignedIn();

    fireEvent.change(field(), { target: { value: 'Who builds IPFS?' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));

    expect(await screen.findByRole('heading', { level: 2, name: 'Who builds IPFS?' })).toBeInTheDocument();
    expect(screen.queryByText(HOME_HEADLINE)).not.toBeInTheDocument();
    await waitFor(() => expect(submitChat).toHaveBeenCalled());
  });

  it('returns to the home on the new-chat event', async () => {
    renderSignedIn();
    fireEvent.change(field(), { target: { value: 'Who builds IPFS?' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));
    await screen.findByRole('heading', { level: 2, name: 'Who builds IPFS?' });
    await waitFor(() => expect(submitChat).toHaveBeenCalled());

    act(() => {
      document.dispatchEvent(new Event('new-chat'));
    });

    expect(await screen.findByText(HOME_HEADLINE)).toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 2, name: 'Who builds IPFS?' })).not.toBeInTheDocument();
    expect(trackMobileHeaderNewConversationClicked).toHaveBeenCalled();
  });
});

describe('AI Search page: a chat handed over in localStorage', () => {
  it('opens the stored answer, clears the handoff and drops a stale error flag', async () => {
    localStorage.setItem('initialChat', JSON.stringify(storedBlogChat));
    renderSignedOut();

    expect(await screen.findByRole('heading', { level: 2, name: 'What is LabWeek?' })).toBeInTheDocument();
    expect(screen.getByText('LabWeek is a gathering.')).toBeInTheDocument();
    expect(screen.queryByText(/Something went wrong/)).not.toBeInTheDocument();
    expect(localStorage.getItem('initialChat')).toBeNull();
  });

  it('gives the opened message a fresh id', async () => {
    saveFeedback.mockResolvedValue({ isSaved: true });
    localStorage.setItem('initialChat', JSON.stringify(storedBlogChat));
    renderSignedIn();

    fireEvent.click(await screen.findByRole('button', { name: 'Good answer' }));

    await waitFor(() => expect(saveFeedback).toHaveBeenCalled());
    const [, feedback] = saveFeedback.mock.calls[0];
    expect(feedback.questionId).toEqual(expect.any(String));
    expect(feedback.questionId).not.toBe('stored-id');
  });

  it('sends the opened answer as context with the first follow-up', async () => {
    localStorage.setItem('initialChat', JSON.stringify(storedBlogChat));
    renderSignedOut();
    await screen.findByRole('heading', { level: 2, name: 'What is LabWeek?' });

    typeAndSend('When is the next one?');

    await waitFor(() => expect(submitChat).toHaveBeenCalled());
    expect(submitChat.mock.calls[0][0]).toMatchObject({
      question: 'When is the next one?',
      chatSummary: {
        user: 'What is LabWeek?',
        system: 'LabWeek is a gathering.',
        sources: ['https://example.com/labweek'],
      },
    });
  });

  it('stays on the home when the stored value is not JSON', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    localStorage.setItem('initialChat', '{broken');
    renderSignedOut();
    await act(async () => {});

    expect(screen.getByText(HOME_HEADLINE)).toBeInTheDocument();
  });
});

describe('AI Search page: a signed-out visit chat picked in the History rail', () => {
  it('opens the picked chat on mount and continues it on its own thread', async () => {
    storeVisitChat();
    sessionStorage.setItem(PENDING_VISIT_CHAT_KEY, 'visit-1');
    renderSignedOut();

    expect(await screen.findByRole('heading', { level: 2, name: 'Who builds IPFS?' })).toBeInTheDocument();
    expect(screen.getByText('Many teams.')).toBeInTheDocument();
    expect(sessionStorage.getItem(PENDING_VISIT_CHAT_KEY)).toBeNull();

    typeAndSend('Which of them are in Berlin?');

    await waitFor(() => expect(submitChat).toHaveBeenCalled());
    expect(submitChat.mock.calls[0][0]).toMatchObject({
      threadId: 'visit-1',
      question: 'Which of them are in Berlin?',
    });
  });

  it('opens the picked chat when the rail announces it on a mounted page', async () => {
    storeVisitChat();
    renderSignedOut();
    expect(screen.getByText(HOME_HEADLINE)).toBeInTheDocument();

    sessionStorage.setItem(PENDING_VISIT_CHAT_KEY, 'visit-1');
    act(() => {
      document.dispatchEvent(new Event(OPEN_VISIT_CHAT_EVENT));
    });

    expect(await screen.findByRole('heading', { level: 2, name: 'Who builds IPFS?' })).toBeInTheDocument();
    expect(screen.queryByText(HOME_HEADLINE)).not.toBeInTheDocument();
    expect(sessionStorage.getItem(PENDING_VISIT_CHAT_KEY)).toBeNull();
  });

  it('stays on the home when the announced chat is not stored', async () => {
    renderSignedOut();

    sessionStorage.setItem(PENDING_VISIT_CHAT_KEY, 'gone');
    act(() => {
      document.dispatchEvent(new Event(OPEN_VISIT_CHAT_EVENT));
    });
    await act(async () => {});

    expect(screen.getByText(HOME_HEADLINE)).toBeInTheDocument();
  });
});
