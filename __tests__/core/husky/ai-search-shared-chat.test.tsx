import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

const push = jest.fn();
const submitChat = jest.fn();
const duplicateThread = jest.fn();
const getHuskyHistory = jest.fn();
const goToLogin = jest.fn();
const toastError = jest.fn();
const onSharedChatContinued = jest.fn();
const onSigninPromptClicked = jest.fn();
const stopChat = jest.fn();
let mockParams: { id?: string } = {};
let mockHasRefreshToken = true;
let mockChatCount = 0;
let mockChatLoading = false;

jest.mock('next/navigation', () => ({
  useParams: () => mockParams,
  useRouter: () => ({ push, refresh: jest.fn() }),
  usePathname: () => '/ai-search',
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock('@/analytics/husky.analytics', () => ({
  useHuskyAnalytics: () =>
    new Proxy(
      {},
      {
        get: () => jest.fn(),
      },
    ),
}));

jest.mock('@/analytics/unified-search.analytics', () => ({
  useUnifiedSearchAnalytics: () => ({ onSharedChatContinued, onSigninPromptClicked }),
}));

jest.mock('@/components/page/husky/sidebar', () => ({
  Sidebar: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useSidebar: () => ({ toggleSidebar: jest.fn(), state: 'expanded', isMobile: false }),
}));

jest.mock('@/components/core/login/utils', () => ({
  useLoginRedirect: () => goToLogin,
}));

jest.mock('@/utils/auth.utils', () => ({
  getUserCredentials: async (isLoggedIn: boolean) => ({
    authToken: isLoggedIn ? 'token' : '',
    userInfo: isLoggedIn ? { uid: 'member-1', name: 'Member', email: 'm@example.com' } : {},
  }),
}));

jest.mock('@/utils/husky.utlils', () => ({
  getChatCount: () => mockChatCount,
  updateLimitType: () => undefined,
  updateChatCount: jest.fn(),
  checkRefreshToken: () => mockHasRefreshToken,
}));

jest.mock('@/utils/common.utils', () => ({
  ...jest.requireActual('@/utils/common.utils'),
  triggerLoader: jest.fn(),
  isMobileDevice: () => false,
}));

jest.mock('@/services/husky.service', () => ({
  createHuskyThread: jest.fn(),
  createThreadTitle: jest.fn(),
  duplicateThread: (...args: any[]) => duplicateThread(...args),
  getHuskyHistory: (...args: any[]) => getHuskyHistory(...args),
  deleteThread: jest.fn(),
}));

jest.mock('@/services/husky/hooks/useHuskyChat', () => ({
  huskySourceRefSchema: require('zod').z.any(),
}));

jest.mock('@ai-sdk/react', () => ({
  experimental_useObject: () => ({
    object: undefined,
    isLoading: mockChatLoading,
    submit: submitChat,
    error: undefined,
    stop: stopChat,
  }),
}));

jest.mock('@/components/core/ToastContainer', () => ({
  toast: { error: (...args: any[]) => toastError(...args), success: jest.fn(), info: jest.fn() },
}));

jest.mock('@/components/page/husky/messages', () => ({
  __esModule: true,
  default: ({ messages }: { messages: any[] }) => (
    <div>
      {messages.map((m, i) => (
        <p key={i}>{m.question}</p>
      ))}
    </div>
  ),
}));
jest.mock('@/components/page/husky/ChatHome', () => ({ ChatHome: () => <div>chat home</div> }));
jest.mock('@/components/core/husky/husky-limit-strip', () => ({ __esModule: true, default: () => null }));

import Chat from '@/components/page/husky/chat';
import AppSidebar from '@/components/page/husky/app-sidebar';
import { OPEN_VISIT_CHAT_EVENT, PENDING_VISIT_CHAT_KEY, getVisitChats, saveVisitChat } from '@/utils/husky-visit-chats';

const sharedMessages = [{ question: 'Which teams work on storage?', answer: 'Filecoin and others.' }];
const owner = { name: 'Maya Chen', image: '/maya.png' };

const renderSharedChat = (props: Partial<React.ComponentProps<typeof Chat>> = {}) =>
  render(
    <Chat
      id="shared-1"
      isLoggedIn
      userInfo={{} as any}
      initialMessages={sharedMessages}
      isOwnThread={false}
      threadOwner={owner}
      title="Storage teams"
      from="detail"
      {...props}
    />,
  );

const typeAndSend = (text: string) => {
  const input = screen.getByPlaceholderText('Go ahead, ask anything!') as HTMLTextAreaElement;
  fireEvent.change(input, { target: { value: text } });
  input.value = text;
  fireEvent.keyDown(input, { key: 'Enter' });
  return input;
};

beforeEach(() => {
  jest.clearAllMocks();
  mockParams = {};
  mockHasRefreshToken = true;
  mockChatCount = 0;
  mockChatLoading = false;
  localStorage.clear();
  sessionStorage.clear();
  getHuskyHistory.mockResolvedValue([]);
});

describe('LAB-2776: a shared chat continues from the normal input', () => {
  it('shows "Shared by <owner>" and the normal input to someone who is not the owner, with no Continue Conversation bar', () => {
    renderSharedChat();

    expect(screen.getByText('Shared by Maya Chen')).toBeInTheDocument();
    expect(screen.getByText('Storage teams')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Go ahead, ask anything!')).toBeInTheDocument();
    expect(screen.queryByText(/Continue Conversation/)).not.toBeInTheDocument();
  });

  it('makes the member a copy on a follow-up, opens it, refreshes History, and leaves the shared chat alone', async () => {
    duplicateThread.mockResolvedValue({ threadId: 'copy-1' });
    const refresh = jest.fn();
    document.addEventListener('refresh-husky-history', refresh);
    renderSharedChat();

    typeAndSend('And in Asia?');

    await waitFor(() => expect(push).toHaveBeenCalledWith('/ai-search/copy-1'));
    expect(duplicateThread).toHaveBeenCalledWith('token', 'shared-1', undefined);
    expect(localStorage.getItem('input')).toBe('And in Asia?');
    expect(refresh).toHaveBeenCalled();
    expect(submitChat).not.toHaveBeenCalled(); // nothing is asked on the sharer's chat
    expect(onSharedChatContinued).toHaveBeenCalledWith('shared-1', 'copy-1');
    document.removeEventListener('refresh-husky-history', refresh);
  });

  it('keeps the text, shows an error and adds no copy when the follow-up fails', async () => {
    duplicateThread.mockResolvedValue({ isError: true, status: 500 });
    const refresh = jest.fn();
    document.addEventListener('refresh-husky-history', refresh);
    renderSharedChat();

    const input = typeAndSend('And in Asia?');

    await waitFor(() => expect(toastError).toHaveBeenCalled());
    expect(input.value).toBe('And in Asia?');
    expect(push).not.toHaveBeenCalled();
    expect(localStorage.getItem('input')).toBeNull();
    expect(refresh).not.toHaveBeenCalled();
    expect(onSharedChatContinued).not.toHaveBeenCalled();
    document.removeEventListener('refresh-husky-history', refresh);
  });

  it('lets the owner of a shared link continue the same chat, with no "Shared by" label', async () => {
    renderSharedChat({ isOwnThread: true });

    expect(screen.queryByText(/Shared by/)).not.toBeInTheDocument();
    typeAndSend('And in Asia?');

    await waitFor(() => expect(submitChat).toHaveBeenCalled());
    expect(submitChat.mock.calls[0][0]).toMatchObject({ threadId: 'shared-1', question: 'And in Asia?' });
    expect(duplicateThread).not.toHaveBeenCalled();
  });

  it('gives a signed-out visitor a guest copy of a shared chat', async () => {
    duplicateThread.mockResolvedValue({ threadId: 'copy-2' });
    renderSharedChat({ isLoggedIn: false });

    typeAndSend('And in Asia?');

    await waitFor(() => expect(push).toHaveBeenCalledWith('/ai-search/copy-2'));
    const [authToken, threadId, guestUserId] = duplicateThread.mock.calls[0];
    expect(authToken).toBe('');
    expect(threadId).toBe('shared-1');
    expect(guestUserId).toEqual(expect.any(String));
  });

  it('makes no copy for a signed-out visitor who reached the daily limit', async () => {
    mockHasRefreshToken = false;
    mockChatCount = 10_000;
    renderSharedChat({ isLoggedIn: false });

    const input = typeAndSend('And in Asia?');
    await act(async () => {});

    expect(duplicateThread).not.toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();
    expect(input.value).toBe('And in Asia?');
  });

  it('makes one copy when the follow-up is sent twice quickly', async () => {
    let resolve: (value: any) => void = () => {};
    duplicateThread.mockReturnValue(new Promise((r) => (resolve = r)));
    renderSharedChat();

    typeAndSend('And in Asia?');
    typeAndSend('And in Asia?');
    await act(async () => resolve({ threadId: 'copy-1' }));

    expect(duplicateThread).toHaveBeenCalledTimes(1);
  });
});

describe('LAB-2776: signed out, the History rail stays', () => {
  it('shows an empty state and "Sign in to keep your chats" before any question', async () => {
    render(<AppSidebar isLoggedIn={false} />);

    expect(await screen.findByText('Chats you start appear here.')).toBeInTheDocument();
    expect(screen.getByText('Sign in to keep your chats')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign up' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
    expect(getHuskyHistory).not.toHaveBeenCalled();
  });

  it('opens the existing sign-in and sign-up flows', async () => {
    render(<AppSidebar isLoggedIn={false} />);

    fireEvent.click(await screen.findByRole('button', { name: 'Sign in' }));
    expect(goToLogin).toHaveBeenCalled();
    expect(onSigninPromptClicked).toHaveBeenCalledWith('sign-in');

    fireEvent.click(screen.getByRole('button', { name: 'Sign up' }));
    expect(push).toHaveBeenCalledWith(expect.stringMatching(/^\/sign-up\?returnTo=/));
    expect(onSigninPromptClicked).toHaveBeenCalledWith('sign-up');
  });

  it("lists this visit's chats and opens one on the AI Search page", async () => {
    saveVisitChat({ threadId: 'visit-1', messages: [{ question: 'Who builds IPFS?', answer: 'Many teams.' }] });
    const opened = jest.fn();
    document.addEventListener(OPEN_VISIT_CHAT_EVENT, opened);
    render(<AppSidebar isLoggedIn={false} />);

    fireEvent.click(await screen.findByText('Who builds IPFS?'));

    expect(opened).toHaveBeenCalled();
    expect(sessionStorage.getItem(PENDING_VISIT_CHAT_KEY)).toBe('visit-1');
    expect(push).toHaveBeenCalledWith('/ai-search');
    document.removeEventListener(OPEN_VISIT_CHAT_EVENT, opened);
  });

  it("adds a signed-out visitor's answered chat, including a copy of a shared link, to this visit's chats", async () => {
    render(
      <Chat
        id="copy-2"
        isLoggedIn={false}
        userInfo={{} as any}
        initialMessages={sharedMessages}
        isOwnThread
        from="detail"
      />,
    );

    await waitFor(() => expect(getVisitChats()).toHaveLength(1));
    expect(getVisitChats()[0]).toMatchObject({ threadId: 'copy-2', title: 'Which teams work on storage?' });
  });

  it('stops a streaming answer when the visitor opens another chat from the rail', () => {
    mockChatLoading = true;
    render(<Chat isLoggedIn={false} userInfo={{} as any} initialMessages={sharedMessages} />);

    act(() => {
      document.dispatchEvent(new CustomEvent(OPEN_VISIT_CHAT_EVENT, { detail: { threadId: 'visit-1' } }));
    });

    expect(stopChat).toHaveBeenCalled();
  });

  it("does not add someone else's shared chat to this visit's chats", async () => {
    renderSharedChat({ isLoggedIn: false });
    await act(async () => {});
    expect(getVisitChats()).toHaveLength(0);
  });

  it('keeps the signed-in History from the server, with no sign-in prompt', async () => {
    getHuskyHistory.mockResolvedValue([
      { title: 'Storage teams', threadId: 't-1', createdAt: new Date().toISOString(), updatedAt: '' },
    ]);
    render(<AppSidebar isLoggedIn />);

    expect(await screen.findByText('Storage teams')).toBeInTheDocument();
    expect(screen.queryByText('Sign in to keep your chats')).not.toBeInTheDocument();
  });
});
