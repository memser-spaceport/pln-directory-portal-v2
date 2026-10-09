import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { subDays, subMonths } from 'date-fns';

const push = jest.fn();
const toggleSidebar = jest.fn();
const getHuskyHistory = jest.fn();
const deleteThread = jest.fn();
let mockParams: { id?: string } = {};

jest.mock('next/navigation', () => ({
  useParams: () => mockParams,
  useRouter: () => ({ push, refresh: jest.fn() }),
  usePathname: () => '/ai-search',
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock('@/analytics/husky.analytics', () => ({
  useHuskyAnalytics: () => new Proxy({}, { get: () => jest.fn() }),
}));

jest.mock('@/components/core/login/utils', () => ({
  useLoginRedirect: () => jest.fn(),
}));

jest.mock('@/utils/auth.utils', () => ({
  getUserCredentials: async () => ({ authToken: 'token' }),
}));

jest.mock('@/utils/common.utils', () => ({
  ...jest.requireActual('@/utils/common.utils'),
  triggerLoader: jest.fn(),
}));

jest.mock('@/services/husky.service', () => ({
  getHuskyHistory: (...args: any[]) => getHuskyHistory(...args),
  deleteThread: (...args: any[]) => deleteThread(...args),
}));

jest.mock('react-toastify', () => ({
  toast: { loading: jest.fn(() => 'toast-id'), update: jest.fn() },
}));

import { groupThreadsByDate } from '@/components/page/husky/utils/groupThreadsByDate';

const now = new Date();
const thread = (threadId: string, title: string, createdAt: Date) => ({
  threadId,
  title,
  createdAt: createdAt.toISOString(),
  updatedAt: createdAt.toISOString(),
});

const HISTORY = [
  thread('t-today', 'Lumen Storage vs Saturn Grid', now),
  thread('t-yesterday', 'Filecoin teams in Berlin', subDays(now, 1)),
  thread('t-week', 'ZK experts with office hours', subDays(now, 4)),
  thread('t-month', 'IPFS for scientific data', subDays(now, 20)),
  thread('t-old', 'LabWeek 2024 teams', new Date(2024, 5, 1)),
];

describe('AI Search history: date groups', () => {
  it('groups by Today, Yesterday, Last 7 days, Last 30 days, then years, newest first', () => {
    const groups = groupThreadsByDate([
      thread('a', 'a', subDays(now, 20)),
      thread('b', 'b', now),
      thread('c', 'c', new Date(2024, 5, 1)),
      thread('d', 'd', subDays(now, 4)),
      thread('e', 'e', subDays(now, 1)),
      thread('f', 'f', new Date(now.getTime() - 60_000)),
    ]);

    expect(groups.map(([label]) => label)).toEqual(['Today', 'Yesterday', 'Last 7 days', 'Last 30 days', '2024']);
    expect(groups[0][1].map((t) => t.threadId)).toEqual(['b', 'f']);
  });

  it('files a chat older than a month from this year under this year instead of dropping it', () => {
    const twoMonthsAgo = subMonths(now, 2);
    const groups = groupThreadsByDate([thread('a', 'a', twoMonthsAgo)]);

    expect(groups).toEqual([[String(twoMonthsAgo.getFullYear()), [expect.objectContaining({ threadId: 'a' })]]]);
  });
});

describe('AI Search page: History rail and chat title bar', () => {
  let AppSidebar: typeof import('@/components/page/husky/app-sidebar').default;
  let ChatTitleBar: typeof import('@/components/page/husky/ChatTitleBar').ChatTitleBar;

  beforeAll(() => {
    jest.doMock('@/components/page/husky/sidebar', () => ({
      Sidebar: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
      useSidebar: () => ({ toggleSidebar, state: 'expanded', isMobile: false }),
    }));
    AppSidebar = require('@/components/page/husky/app-sidebar').default;
    ChatTitleBar = require('@/components/page/husky/ChatTitleBar').ChatTitleBar;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockParams = {};
    getHuskyHistory.mockResolvedValue(HISTORY);
    deleteThread.mockResolvedValue(true);
  });

  const searchFor = (text: string) =>
    fireEvent.change(screen.getByRole('searchbox', { name: 'Search chats' }), { target: { value: text } });

  it('narrows History to chats whose title matches as the member types, and shows all again when cleared', async () => {
    render(<AppSidebar isLoggedIn />);
    await screen.findByText('Lumen Storage vs Saturn Grid');

    searchFor('berlin');
    expect(screen.getByText('Filecoin teams in Berlin')).toBeInTheDocument();
    expect(screen.queryByText('Lumen Storage vs Saturn Grid')).not.toBeInTheDocument();
    expect(screen.getByText('Yesterday')).toBeInTheDocument();
    expect(screen.queryByText('Today')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Clear search' }));
    expect(screen.getByText('Lumen Storage vs Saturn Grid')).toBeInTheDocument();
    expect(screen.getByText('LabWeek 2024 teams')).toBeInTheDocument();
  });

  it('says so when no chat matches', async () => {
    render(<AppSidebar isLoggedIn />);
    await screen.findByText('Lumen Storage vs Saturn Grid');

    searchFor('zzzz');

    expect(screen.getByText('No chats match “zzzz”.')).toBeInTheDocument();
  });

  it('labels the groups by date and marks the open chat', async () => {
    mockParams = { id: 't-week' };
    render(<AppSidebar isLoggedIn />);
    await screen.findByText('Lumen Storage vs Saturn Grid');

    ['Today', 'Yesterday', 'Last 7 days', 'Last 30 days', '2024'].forEach((label) =>
      expect(screen.getByText(label)).toBeInTheDocument(),
    );
    expect(screen.getByText('ZK experts with office hours').closest('li')).toHaveAttribute('data-active', 'true');
    expect(screen.getByText('Filecoin teams in Berlin').closest('li')).toHaveAttribute('data-active', 'false');
  });

  it('marks a chat opened on /ai-search, which has no id in the URL, once the chat announces it', async () => {
    render(<AppSidebar isLoggedIn />);
    await screen.findByText('Lumen Storage vs Saturn Grid');

    act(() => {
      document.dispatchEvent(new CustomEvent('refresh-husky-history', { detail: { openThreadId: 't-today' } }));
    });

    await waitFor(() =>
      expect(screen.getByText('Lumen Storage vs Saturn Grid').closest('li')).toHaveAttribute('data-active', 'true'),
    );
  });

  it("shows the open chat's title and a ⋯ menu", () => {
    render(<ChatTitleBar chat={{ threadId: 't-today', title: 'Lumen Storage vs Saturn Grid' }} />);

    expect(screen.getByRole('heading', { name: 'Lumen Storage vs Saturn Grid' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'More actions for this chat' })).toBeInTheDocument();
  });

  it('deletes the open chat after confirmation and leaves the member on a new chat', async () => {
    mockParams = { id: 't-today' };
    const newChat = jest.fn();
    document.addEventListener('new-chat', newChat);
    render(
      <>
        <AppSidebar isLoggedIn />
        <ChatTitleBar chat={{ threadId: 't-today', title: 'Lumen Storage vs Saturn Grid' }} />
      </>,
    );
    await screen.findAllByText('Lumen Storage vs Saturn Grid');

    fireEvent.click(screen.getByRole('button', { name: 'More actions for this chat' }));
    fireEvent.click(await screen.findByRole('menuitem', { name: 'Delete' }));

    expect(screen.getByText('Delete chat?')).toBeInTheDocument();
    expect(
      screen.getByText(
        '“Lumen Storage vs Saturn Grid” will be removed from your history, and its link will stop working.',
      ),
    ).toBeInTheDocument();
    expect(deleteThread).not.toHaveBeenCalled();

    getHuskyHistory.mockResolvedValue(HISTORY.slice(1));
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

    await waitFor(() => expect(push).toHaveBeenCalledWith('/ai-search'));
    expect(deleteThread).toHaveBeenCalledWith('token', 't-today');
    expect(newChat).toHaveBeenCalled();
    await waitFor(() => expect(screen.getAllByText('Lumen Storage vs Saturn Grid')).toHaveLength(1));
    document.removeEventListener('new-chat', newChat);
  });

  it('keeps the open chat when another chat is deleted from the rail', async () => {
    mockParams = { id: 't-today' };
    const newChat = jest.fn();
    document.addEventListener('new-chat', newChat);
    render(<AppSidebar isLoggedIn />);
    await screen.findByText('Lumen Storage vs Saturn Grid');

    const row = screen.getByText('Filecoin teams in Berlin').closest('li') as HTMLElement;
    fireEvent.click(within(row).getByRole('button', { hidden: true }));
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

    await waitFor(() => expect(deleteThread).toHaveBeenCalledWith('token', 't-yesterday'));
    expect(newChat).not.toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();
    document.removeEventListener('new-chat', newChat);
  });

  it("offers no Delete on someone else's shared chat", () => {
    render(<ChatTitleBar chat={{ threadId: 'shared-1', title: 'Storage teams', sharedBy: { name: 'Maya Chen' } }} />);

    expect(screen.getByText('Shared by Maya Chen')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'More actions for this chat' })).not.toBeInTheDocument();
  });

  it('opens History from a labelled button, with New chat beside it', () => {
    render(<ChatTitleBar chat={{ threadId: 't-today', title: 'Lumen Storage vs Saturn Grid' }} />);

    fireEvent.click(screen.getByRole('button', { name: 'History' }));
    expect(toggleSidebar).toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'New chat' }));
    expect(push).toHaveBeenCalledWith('/ai-search');
  });
});

describe('AI Search rail shortcut', () => {
  beforeAll(() => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: (query: string) => ({
        matches: false,
        media: query,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      }),
    });
  });

  it('collapses and expands the rail with ⌘B on desktop', () => {
    const { SidebarProvider, useSidebar } = jest.requireActual('@/components/page/husky/sidebar');
    const RailState = () => <span>{useSidebar().state}</span>;
    render(
      <SidebarProvider>
        <RailState />
      </SidebarProvider>,
    );

    expect(screen.getByText('expanded')).toBeInTheDocument();
    fireEvent.keyDown(window, { key: 'b', metaKey: true });
    expect(screen.getByText('collapsed')).toBeInTheDocument();
    fireEvent.keyDown(window, { key: 'b', metaKey: true });
    expect(screen.getByText('expanded')).toBeInTheDocument();
  });
});
