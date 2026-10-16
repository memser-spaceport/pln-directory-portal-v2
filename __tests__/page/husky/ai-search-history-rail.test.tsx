import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom';

const push = jest.fn();
const replace = jest.fn();
const goToLogin = jest.fn();
const getHuskyHistory = jest.fn();
const deleteThread = jest.fn();
const getUserCredentials = jest.fn();
const analytics: Record<string, jest.Mock> = {};
const track = (name: string) => (analytics[name] ??= jest.fn());
const toast = { loading: jest.fn(() => 'toast-id'), update: jest.fn() };
let mockParams: { id?: string } = {};
let mockIsMobile = false;

jest.mock('next/navigation', () => ({
  useParams: () => mockParams,
  useRouter: () => ({ push, replace }),
  usePathname: () => '/ai-search',
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock('@/analytics/husky.analytics', () => ({
  useHuskyAnalytics: () =>
    new Proxy(analytics, {
      get: (_target, key: string) => track(key),
    }),
}));

jest.mock('@/components/core/login/utils', () => ({
  useLoginRedirect: () => goToLogin,
}));

jest.mock('@/utils/auth.utils', () => ({
  getUserCredentials: (...args: any[]) => getUserCredentials(...args),
}));

jest.mock('@/services/husky.service', () => ({
  getHuskyHistory: (...args: any[]) => getHuskyHistory(...args),
  deleteThread: (...args: any[]) => deleteThread(...args),
}));

jest.mock('react-toastify', () => ({ toast }));

jest.mock('@/hooks/useIsBelowTabletLandscape', () => ({
  useIsBelowTabletLandscape: () => mockIsMobile,
}));

import { SidebarProvider } from '@/components/page/husky/SidebarProvider';
import { AppSidebar } from '@/components/page/husky/AppSidebar';
import { saveVisitChat } from '@/components/page/husky/utils/saveVisitChat';
import { getVisitChats } from '@/components/page/husky/utils/getVisitChats';
import {
  OPEN_VISIT_CHAT_EVENT,
  PENDING_VISIT_CHAT_KEY,
  VISIT_CHATS_STORAGE_KEY,
} from '@/components/page/husky/constants/visitChats';

const NOW = new Date(2026, 9, 14, 12, 0, 0);
const daysAgo = (days: number) => new Date(NOW.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
const thread = (threadId: string, title: string, createdAt: string) => ({
  threadId,
  title,
  createdAt,
  updatedAt: createdAt,
});

const HISTORY = [
  thread('t-old', 'LabWeek 2024 teams', new Date(2024, 5, 1).toISOString()),
  thread('t-2025', 'Funding rounds 2025', new Date(2025, 2, 1).toISOString()),
  thread('t-today-early', 'Morning question', daysAgo(0.1)),
  thread('t-today', 'Lumen Storage vs Saturn Grid', daysAgo(0)),
  thread('t-month', 'IPFS for scientific data', daysAgo(20)),
  thread('t-week', 'ZK experts with office hours', daysAgo(4)),
  thread('t-yesterday', 'Filecoin teams in Berlin', daysAgo(1)),
];

const writeVisitChat = (threadId: string, title: string, updatedAt: string) => ({
  threadId,
  title,
  createdAt: updatedAt,
  updatedAt,
  messages: [{ question: title, answer: 'Answer' }],
});

const renderRail = (isLoggedIn = true) =>
  render(
    <SidebarProvider data-testid="provider">
      <AppSidebar isLoggedIn={isLoggedIn} />
    </SidebarProvider>,
  );

const rowOf = (title: string) => screen.getByText(title).closest('li') as HTMLElement;
const clickDeleteOn = (title: string) => fireEvent.click(within(rowOf(title)).getByAltText('delete'));
const listenTo = (eventName: string) => {
  const listener = jest.fn();
  document.addEventListener(eventName, listener);
  return listener;
};

const userAgent = navigator.userAgent;
const setUserAgent = (value: string) => Object.defineProperty(navigator, 'userAgent', { configurable: true, value });

beforeEach(() => {
  jest.useFakeTimers({ now: NOW, advanceTimers: true });
  jest.clearAllMocks();
  Object.keys(analytics).forEach((key) => delete analytics[key]);
  sessionStorage.clear();
  mockParams = {};
  mockIsMobile = false;
  setUserAgent(userAgent);
  getUserCredentials.mockResolvedValue({ authToken: 'token' });
  getHuskyHistory.mockResolvedValue(HISTORY);
  deleteThread.mockResolvedValue(true);
});

afterEach(() => {
  jest.useRealTimers();
});

describe('AI Search History rail: signed in', () => {
  it('shows a loading skeleton while History loads, then the chats, fetched with the member token', async () => {
    let resolveHistory: (value: unknown) => void = () => {};
    getHuskyHistory.mockReturnValue(new Promise((resolve) => (resolveHistory = resolve)));
    const { container } = renderRail();

    expect(container.querySelectorAll('.skeleton')).toHaveLength(5);
    expect(screen.getByText('History')).toBeInTheDocument();

    await act(async () => resolveHistory(HISTORY));

    expect(container.querySelectorAll('.skeleton')).toHaveLength(0);
    expect(screen.getByText('Lumen Storage vs Saturn Grid')).toBeInTheDocument();
    expect(getUserCredentials).toHaveBeenCalledWith(true);
    expect(getHuskyHistory).toHaveBeenCalledWith('token');
  });

  it('shows the signed-in empty state when the member has no chats', async () => {
    getHuskyHistory.mockResolvedValue([]);
    renderRail();

    expect(await screen.findByText('Your conversations will appear here once you start chatting!')).toBeInTheDocument();
    expect(screen.queryByText('Sign in to keep your chats')).not.toBeInTheDocument();
  });

  it('shows the empty state when History answers with an error', async () => {
    getHuskyHistory.mockResolvedValue({ isError: true });
    renderRail();

    expect(await screen.findByText('Your conversations will appear here once you start chatting!')).toBeInTheDocument();
  });

  it('shows the empty state when loading History fails', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    getHuskyHistory.mockRejectedValue(new Error('offline'));
    renderRail();

    expect(await screen.findByText('Your conversations will appear here once you start chatting!')).toBeInTheDocument();
    consoleError.mockRestore();
  });

  it('orders the date groups recent first then years newest first, with the newest chat first inside a group', async () => {
    const { container } = renderRail();
    await screen.findByText('Lumen Storage vs Saturn Grid');

    const labels = [...container.querySelectorAll('.groupLabel')].map((el) => el.textContent);
    expect(labels).toEqual(['Today', 'Yesterday', 'Last 7 days', 'Last 30 days', '2025', '2024']);

    const todayGroup = screen.getByText('Today').parentElement as HTMLElement;
    expect(
      within(todayGroup)
        .getAllByRole('listitem', { hidden: true })
        .map((li) => li.textContent),
    ).toEqual(['Lumen Storage vs Saturn Grid', 'Morning question']);
  });

  it('filters by title ignoring case and surrounding spaces, and quotes the trimmed term when nothing matches', async () => {
    renderRail();
    await screen.findByText('Lumen Storage vs Saturn Grid');
    const search = screen.getByRole('searchbox', { name: 'Search chats', hidden: true });

    fireEvent.change(search, { target: { value: '  IPFS  ' } });
    expect(screen.getByText('IPFS for scientific data')).toBeInTheDocument();
    expect(screen.getAllByRole('listitem', { hidden: true })).toHaveLength(1);
    expect(screen.getByText('Last 30 days')).toBeInTheDocument();

    fireEvent.change(search, { target: { value: '  nothing here ' } });
    expect(screen.getByText('No chats match “nothing here”.')).toBeInTheDocument();
  });

  it('opens a chat at /ai-search/<id> and tracks the click', async () => {
    const loader = listenTo('TRIGGER_LOADER');
    renderRail();

    fireEvent.click(await screen.findByText('Filecoin teams in Berlin'));

    expect(push).toHaveBeenCalledWith('/ai-search/t-yesterday');
    expect(track('trackHistoryListItemClicked')).toHaveBeenCalledWith({
      threadId: 't-yesterday',
      title: 'Filecoin teams in Berlin',
    });
    expect(loader).toHaveBeenCalled();
    document.removeEventListener('TRIGGER_LOADER', loader);
  });

  it('does nothing when the chat already open is clicked', async () => {
    mockParams = { id: 't-today' };
    renderRail();

    fireEvent.click(await screen.findByText('Lumen Storage vs Saturn Grid'));

    expect(push).not.toHaveBeenCalled();
    expect(track('trackHistoryListItemClicked')).not.toHaveBeenCalled();
  });

  it('clears the open-chat mark on new-chat', async () => {
    renderRail();
    await screen.findByText('Lumen Storage vs Saturn Grid');
    act(() => {
      document.dispatchEvent(new CustomEvent('refresh-husky-history', { detail: { openThreadId: 't-today' } }));
    });
    await waitFor(() => expect(rowOf('Lumen Storage vs Saturn Grid')).toHaveAttribute('data-active', 'true'));

    act(() => {
      document.dispatchEvent(new CustomEvent('new-chat'));
    });

    expect(rowOf('Lumen Storage vs Saturn Grid')).toHaveAttribute('data-active', 'false');
  });

  it('reloads History on refresh-husky-history without showing the skeleton again', async () => {
    const { container } = renderRail();
    await screen.findByText('Lumen Storage vs Saturn Grid');
    getHuskyHistory.mockResolvedValue([...HISTORY, thread('t-new', 'Brand new chat', daysAgo(0))]);

    act(() => {
      document.dispatchEvent(new CustomEvent('refresh-husky-history'));
    });

    expect(container.querySelectorAll('.skeleton')).toHaveLength(0);
    expect(await screen.findByText('Brand new chat')).toBeInTheDocument();
    expect(getHuskyHistory).toHaveBeenCalledTimes(2);
  });

  it('starts a new chat from the New chat button', async () => {
    const newChat = listenTo('new-chat');
    renderRail();
    await screen.findByText('Lumen Storage vs Saturn Grid');

    fireEvent.click(screen.getByRole('button', { name: 'New chat', hidden: true }));

    expect(push).toHaveBeenCalledWith('/ai-search');
    expect(newChat).toHaveBeenCalled();
    expect(track('trackSidebarNewConversationClicked')).toHaveBeenCalled();
    document.removeEventListener('new-chat', newChat);
  });

  it('collapses the rail from its toggle buttons and expands it from the History header', async () => {
    renderRail();
    await screen.findByText('Lumen Storage vs Saturn Grid');
    const provider = screen.getByTestId('provider');

    fireEvent.click(screen.getAllByRole('button', { name: 'toggle sidebar', hidden: true })[1]);
    expect(provider).toHaveAttribute('data-state', 'collapsed');
    expect(track('trackSidebarToggleClicked')).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByText('History'));
    expect(provider).toHaveAttribute('data-state', 'expanded');

    fireEvent.click(screen.getByText('History'));
    expect(provider).toHaveAttribute('data-state', 'expanded');

    fireEvent.click(screen.getAllByRole('button', { name: 'toggle sidebar', hidden: true })[0]);
    expect(provider).toHaveAttribute('data-state', 'collapsed');
    expect(track('trackSidebarToggleClicked')).toHaveBeenCalledTimes(3);
  });

  it('labels the shortcut ⌘ on a Mac', async () => {
    setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)');
    renderRail();
    await screen.findByText('Lumen Storage vs Saturn Grid');

    expect(screen.getByText('⌘')).toBeInTheDocument();
    expect(screen.queryByText('Ctrl')).not.toBeInTheDocument();
    expect(screen.getByText('to expand/collapse')).toBeInTheDocument();
  });

  it('labels the shortcut Ctrl elsewhere', async () => {
    setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64)');
    renderRail();
    await screen.findByText('Lumen Storage vs Saturn Grid');

    expect(screen.getByText('Ctrl')).toBeInTheDocument();
    expect(screen.queryByText('⌘')).not.toBeInTheDocument();
  });
});

describe('AI Search History rail: deleting a signed-in chat', () => {
  it('asks first and does nothing on Cancel', async () => {
    renderRail();
    await screen.findByText('Lumen Storage vs Saturn Grid');

    clickDeleteOn('Filecoin teams in Berlin');

    expect(screen.getByText('Delete chat?')).toBeInTheDocument();
    expect(
      screen.getByText('“Filecoin teams in Berlin” will be removed from your history, and its link will stop working.'),
    ).toBeInTheDocument();
    expect(track('trackDeleteThread')).toHaveBeenCalledWith('t-yesterday', 'Filecoin teams in Berlin');
    expect(push).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(screen.queryByText('Delete chat?')).not.toBeInTheDocument();
    expect(deleteThread).not.toHaveBeenCalled();
  });

  it('deletes after confirmation, reloads History and reports success in a toast', async () => {
    renderRail();
    await screen.findByText('Lumen Storage vs Saturn Grid');
    clickDeleteOn('Filecoin teams in Berlin');
    getHuskyHistory.mockResolvedValue(HISTORY.filter((t) => t.threadId !== 't-yesterday'));

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

    await waitFor(() => expect(screen.queryByText('Filecoin teams in Berlin')).not.toBeInTheDocument());
    expect(deleteThread).toHaveBeenCalledWith('token', 't-yesterday');
    expect(screen.queryByText('Delete chat?')).not.toBeInTheDocument();
    expect(toast.loading).toHaveBeenCalledWith('Deleting thread...');
    await waitFor(() =>
      expect(toast.update).toHaveBeenCalledWith('toast-id', {
        render: 'Thread deleted successfully!',
        type: 'success',
        isLoading: false,
        autoClose: 3000,
      }),
    );
    expect(track('trackThreadDeleteConfirmationStatus')).toHaveBeenCalledWith('t-yesterday', 'initiated');
    expect(track('trackThreadDeleteConfirmationStatus')).toHaveBeenCalledWith('t-yesterday', 'success');
  });

  it('keeps the chat and shows an error toast when the server refuses the delete', async () => {
    deleteThread.mockResolvedValue(false);
    renderRail();
    await screen.findByText('Lumen Storage vs Saturn Grid');
    clickDeleteOn('Filecoin teams in Berlin');

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

    await waitFor(() =>
      expect(toast.update).toHaveBeenCalledWith('toast-id', {
        render: 'Failed to delete thread. Please try again.',
        type: 'error',
        isLoading: false,
        autoClose: 3000,
      }),
    );
    expect(screen.getByText('Filecoin teams in Berlin')).toBeInTheDocument();
    expect(getHuskyHistory).toHaveBeenCalledTimes(1);
    expect(track('trackThreadDeleteConfirmationStatus')).toHaveBeenCalledWith('t-yesterday', 'failed');
  });

  it('shows an error toast when the delete request throws', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    deleteThread.mockRejectedValue(new Error('offline'));
    renderRail();
    await screen.findByText('Lumen Storage vs Saturn Grid');
    clickDeleteOn('Filecoin teams in Berlin');

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

    await waitFor(() =>
      expect(toast.update).toHaveBeenCalledWith(
        'toast-id',
        expect.objectContaining({ render: 'Failed to delete thread. Please try again.', type: 'error' }),
      ),
    );
    expect(screen.getByText('Filecoin teams in Berlin')).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it('opens the confirmation from a delete-thread event, naming the chat or falling back to "This chat"', async () => {
    renderRail();
    await screen.findByText('Lumen Storage vs Saturn Grid');

    act(() => {
      document.dispatchEvent(new CustomEvent('delete-thread', { detail: { threadId: 't-today', title: '' } }));
    });

    expect(
      screen.getByText('This chat will be removed from your history, and its link will stop working.'),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    await waitFor(() => expect(deleteThread).toHaveBeenCalledWith('token', 't-today'));
  });
});

describe('AI Search History rail: below 960px', () => {
  beforeEach(() => {
    mockIsMobile = true;
  });

  const openDrawer = async () => {
    renderRail();
    act(() => {
      fireEvent.keyDown(window, { key: 'b', ctrlKey: true });
    });
    await screen.findByText('Filecoin teams in Berlin');
  };

  it('closes the drawer after opening a chat', async () => {
    await openDrawer();

    fireEvent.click(screen.getByText('Filecoin teams in Berlin'));

    expect(push).toHaveBeenCalledWith('/ai-search/t-yesterday');
    expect(screen.queryByText('Filecoin teams in Berlin')).not.toBeInTheDocument();
  });

  it('closes the drawer after starting a new chat', async () => {
    await openDrawer();

    fireEvent.click(screen.getByRole('button', { name: 'New chat', hidden: true }));

    expect(push).toHaveBeenCalledWith('/ai-search');
    expect(screen.queryByRole('button', { name: 'New chat', hidden: true })).not.toBeInTheDocument();
  });
});

describe('AI Search History rail: signed out', () => {
  it("lists this visit's chats newest first, without date groups, under This visit", async () => {
    sessionStorage.setItem(
      VISIT_CHATS_STORAGE_KEY,
      JSON.stringify([
        writeVisitChat('v-older', 'Older visit chat', daysAgo(1)),
        writeVisitChat('v-newer', 'Newer visit chat', daysAgo(0)),
      ]),
    );
    renderRail(false);

    await screen.findByText('Newer visit chat');
    expect(screen.getAllByRole('listitem', { hidden: true }).map((li) => li.textContent)).toEqual([
      'Newer visit chat',
      'Older visit chat',
    ]);
    expect(screen.getByText('This visit')).toBeInTheDocument();
    expect(screen.queryByText('History')).not.toBeInTheDocument();
    expect(screen.queryByText('Today')).not.toBeInTheDocument();
    expect(getHuskyHistory).not.toHaveBeenCalled();
  });

  it('reopens a visit chat even when the rail already marks it as open', async () => {
    saveVisitChat({ threadId: 'v-1', messages: [{ question: 'Who builds IPFS?', answer: 'Many teams.' }] });
    const opened = listenTo(OPEN_VISIT_CHAT_EVENT);
    renderRail(false);
    fireEvent.click(await screen.findByText('Who builds IPFS?'));
    expect(rowOf('Who builds IPFS?')).toHaveAttribute('data-active', 'true');

    fireEvent.click(screen.getByText('Who builds IPFS?'));

    expect(opened).toHaveBeenCalledTimes(2);
    expect(sessionStorage.getItem(PENDING_VISIT_CHAT_KEY)).toBe('v-1');
    expect(push).toHaveBeenLastCalledWith('/ai-search');
    expect(track('trackHistoryListItemClicked')).toHaveBeenCalledWith({ threadId: 'v-1', title: 'Who builds IPFS?' });
    document.removeEventListener(OPEN_VISIT_CHAT_EVENT, opened);
  });

  it('does nothing when the visit chat whose page is open is clicked', async () => {
    mockParams = { id: 'v-1' };
    saveVisitChat({ threadId: 'v-1', messages: [{ question: 'Who builds IPFS?', answer: 'Many teams.' }] });
    const opened = listenTo(OPEN_VISIT_CHAT_EVENT);
    renderRail(false);

    fireEvent.click(await screen.findByText('Who builds IPFS?'));

    expect(opened).not.toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();
    document.removeEventListener(OPEN_VISIT_CHAT_EVENT, opened);
  });

  it('closes the drawer below 960px after opening a visit chat', async () => {
    mockIsMobile = true;
    saveVisitChat({ threadId: 'v-1', messages: [{ question: 'Who builds IPFS?', answer: 'Many teams.' }] });
    renderRail(false);
    act(() => {
      fireEvent.keyDown(window, { key: 'b', metaKey: true });
    });

    fireEvent.click(await screen.findByText('Who builds IPFS?'));

    expect(push).toHaveBeenCalledWith('/ai-search');
    expect(screen.queryByText('Who builds IPFS?')).not.toBeInTheDocument();
  });

  it("removes a visit chat from this visit's chats after confirmation, without the server or a toast", async () => {
    saveVisitChat({ threadId: 'v-1', messages: [{ question: 'Who builds IPFS?', answer: 'Many teams.' }] });
    const newChat = listenTo('new-chat');
    renderRail(false);
    await screen.findByText('Who builds IPFS?');

    clickDeleteOn('Who builds IPFS?');
    expect(screen.getByText("“Who builds IPFS?” will be removed from this visit's chats.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

    await waitFor(() => expect(screen.queryByText('Who builds IPFS?')).not.toBeInTheDocument());
    expect(screen.getByText('Chats you start appear here.')).toBeInTheDocument();
    expect(getVisitChats()).toHaveLength(0);
    expect(deleteThread).not.toHaveBeenCalled();
    expect(toast.loading).not.toHaveBeenCalled();
    expect(newChat).not.toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();
    document.removeEventListener('new-chat', newChat);
  });

  it('leaves a visit chat opened from the rail when it is deleted', async () => {
    saveVisitChat({ threadId: 'v-1', messages: [{ question: 'Who builds IPFS?', answer: 'Many teams.' }] });
    const newChat = listenTo('new-chat');
    renderRail(false);
    fireEvent.click(await screen.findByText('Who builds IPFS?'));
    push.mockClear();

    clickDeleteOn('Who builds IPFS?');
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

    await waitFor(() => expect(push).toHaveBeenCalledWith('/ai-search'));
    expect(newChat).toHaveBeenCalled();
    document.removeEventListener('new-chat', newChat);
  });

  it('sends Sign up to the sign-up page with the current page as returnTo', async () => {
    window.history.pushState({}, '', '/ai-search?q=storage');
    renderRail(false);

    fireEvent.click(await screen.findByRole('button', { name: 'Sign up', hidden: true }));

    expect(push).toHaveBeenCalledWith(`/sign-up?returnTo=${encodeURIComponent('/ai-search?q=storage')}`);
    window.history.pushState({}, '', '/');
  });

  it('opens sign-in from Sign in', async () => {
    renderRail(false);

    fireEvent.click(await screen.findByRole('button', { name: 'Sign in', hidden: true }));

    expect(goToLogin).toHaveBeenCalledWith();
  });
});
