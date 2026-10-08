import { act, fireEvent, render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom';

const push = jest.fn();
const trackHistorySearched = jest.fn();
const trackMobileDeleteThread = jest.fn();
const deleteThread = jest.fn();

jest.mock('@/analytics/husky.analytics', () => ({
  useHuskyAnalytics: () => ({
    trackMobileHeaderToggleClicked: jest.fn(),
    trackMobileDeleteThread,
    trackHistoryListItemClicked: jest.fn(),
    trackDeleteThread: jest.fn(),
    trackSidebarToggleClicked: jest.fn(),
    trackSidebarNewConversationClicked: jest.fn(),
    trackThreadDeleteConfirmationStatus: jest.fn(),
    trackHistorySearched,
  }),
}));

jest.mock('next/navigation', () => ({
  useParams: () => ({ id: 'thread-1' }),
  useRouter: () => ({ push }),
  usePathname: () => '/ai-search/thread-1',
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock('@/components/page/husky/sidebar', () => ({
  Sidebar: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useSidebar: () => ({
    toggleSidebar: jest.fn(),
    state: 'expanded',
    isMobile: false,
  }),
}));

jest.mock('@/utils/auth.utils', () => ({
  getUserCredentials: async () => ({ authToken: 'token' }),
}));

jest.mock('@/utils/common.utils', () => ({
  ...jest.requireActual('@/utils/common.utils'),
  triggerLoader: jest.fn(),
}));

jest.mock('react-toastify', () => ({
  toast: { loading: jest.fn(() => 'toast-1'), update: jest.fn() },
}));

const daysAgo = (days: number) => new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

jest.mock('@/services/husky.service', () => ({
  getHuskyHistory: async () => [
    { title: 'Storage teams', threadId: 'thread-1', createdAt: daysAgo(0), updatedAt: daysAgo(0) },
    { title: 'Berlin events', threadId: 'thread-2', createdAt: daysAgo(3), updatedAt: daysAgo(3) },
    { title: 'Filecoin grants', threadId: 'thread-3', createdAt: daysAgo(400), updatedAt: daysAgo(400) },
  ],
  deleteThread: (...args: unknown[]) => deleteThread(...args),
}));

import ChatHeader from '@/components/page/husky/chat-header';
import AppSidebar from '@/components/page/husky/app-sidebar';
import { filterThreadsByTitle, groupThreadsByDate } from '@/components/page/husky/history-utils';

const thread = (threadId: string, title: string, updatedAt: string, createdAt = updatedAt) => ({
  threadId,
  title,
  createdAt,
  updatedAt,
});

describe('LAB-2774: History date groups', () => {
  const now = new Date(2026, 9, 8, 12, 0, 0);
  const at = (y: number, m: number, d: number) => new Date(y, m, d, 9, 0, 0).toISOString();

  it('groups chats under Today, Yesterday, Last 7 days, Last 30 days and then by year, newest first', () => {
    const groups = groupThreadsByDate(
      [
        thread('a', 'Old', at(2025, 2, 1)),
        thread('b', 'Today 1', at(2026, 9, 8)),
        thread('c', 'Week', at(2026, 9, 4)),
        thread('d', 'Yesterday', at(2026, 9, 7)),
        thread('e', 'Month', at(2026, 8, 20)),
        thread('f', 'Today 2', new Date(2026, 9, 8, 11, 0, 0).toISOString()),
        thread('g', 'Older', at(2024, 0, 3)),
      ],
      now,
    );

    expect(groups.map(([label]) => label)).toEqual([
      'Today',
      'Yesterday',
      'Last 7 days',
      'Last 30 days',
      '2025',
      '2024',
    ]);
    expect(groups[0][1].map((t) => t.threadId)).toEqual(['f', 'b']);
  });

  it('files a chat older than 30 days from the current year under that year', () => {
    const groups = groupThreadsByDate([thread('a', 'Spring', at(2026, 2, 1))], now);

    expect(groups).toEqual([['2026', [expect.objectContaining({ threadId: 'a' })]]]);
  });

  it('uses the last-updated time, and the created time when there is no update time', () => {
    const groups = groupThreadsByDate(
      [thread('a', 'Revived', at(2026, 9, 8), at(2025, 0, 1)), thread('b', 'No update', '', at(2026, 9, 7))],
      now,
    );

    expect(groups.map(([label]) => label)).toEqual(['Today', 'Yesterday']);
  });

  it('does not show empty groups and skips chats with no valid date', () => {
    const groups = groupThreadsByDate([thread('a', 'Broken', 'not-a-date', 'not-a-date')], now);

    expect(groups).toEqual([]);
  });
});

describe('LAB-2774: History title filter', () => {
  const threads = [thread('a', 'Storage Teams', ''), thread('b', 'Berlin events', '')];

  it('keeps chats whose title contains the text, in any letter case', () => {
    expect(filterThreadsByTitle(threads, '  sToRaGe ').map((t) => t.threadId)).toEqual(['a']);
  });

  it('keeps every chat when the text is empty', () => {
    expect(filterThreadsByTitle(threads, '   ')).toHaveLength(2);
  });
});

describe('LAB-2774: Search chats in the History rail', () => {
  beforeEach(() => {
    jest.useRealTimers();
    trackHistorySearched.mockClear();
  });

  it('narrows the list by title as the member types, and shows all chats again when cleared', async () => {
    render(<AppSidebar isLoggedIn />);
    expect(await screen.findByText('Storage teams')).toBeInTheDocument();

    const field = screen.getByRole('searchbox', { name: 'Search chats' });
    fireEvent.change(field, { target: { value: 'berlin' } });

    expect(screen.getByText('Berlin events')).toBeInTheDocument();
    expect(screen.queryByText('Storage teams')).not.toBeInTheDocument();
    expect(screen.queryByText('Filecoin grants')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Clear search' }));

    expect(field).toHaveValue('');
    expect(screen.getByText('Storage teams')).toBeInTheDocument();
    expect(screen.getByText('Berlin events')).toBeInTheDocument();
    expect(screen.getByText('Filecoin grants')).toBeInTheDocument();
  });

  it('shows an empty-state line when no chat matches', async () => {
    render(<AppSidebar isLoggedIn />);
    await screen.findByText('Storage teams');

    fireEvent.change(screen.getByRole('searchbox', { name: 'Search chats' }), { target: { value: 'zzz' } });

    expect(screen.getByText('No chats match “zzz”.')).toBeInTheDocument();
    expect(screen.queryByRole('listitem')).not.toBeInTheDocument();
  });

  it('sends the search event once per search, after the member stops typing', async () => {
    render(<AppSidebar isLoggedIn />);
    await screen.findByText('Storage teams');
    jest.useFakeTimers();

    const field = screen.getByRole('searchbox', { name: 'Search chats' });
    fireEvent.change(field, { target: { value: 'st' } });
    fireEvent.change(field, { target: { value: 'stor' } });
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(trackHistorySearched).toHaveBeenCalledTimes(1);
    expect(trackHistorySearched).toHaveBeenCalledWith({ query: 'stor', resultCount: 1 });
  });

  it('shows the date group labels and marks the open chat', async () => {
    render(<AppSidebar isLoggedIn />);
    await screen.findByText('Storage teams');

    expect(screen.getByText('Today')).toBeInTheDocument();
    expect(screen.getByText('Last 7 days')).toBeInTheDocument();
    expect(screen.getByText(String(new Date(daysAgo(400)).getFullYear()))).toBeInTheDocument();

    const open = screen.getByText('Storage teams').closest('li');
    expect(open).toHaveAttribute('aria-current', 'page');
    expect(screen.getByText('Berlin events').closest('li')).not.toHaveAttribute('aria-current');
  });
});

describe('LAB-2774: open-chat title bar', () => {
  it('shows the chat title and a ⋯ menu with Delete, and no Share', () => {
    render(<ChatHeader showActions title="Storage teams" />);

    expect(screen.getByRole('heading', { name: 'Storage teams' })).toBeInTheDocument();
    expect(screen.queryByText('Share')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'more options' }));

    expect(screen.getByText('Delete')).toBeInTheDocument();
    expect(screen.queryByText('Share')).not.toBeInTheDocument();
  });

  it('shows the title only, with no menu, for a chat the member does not own', () => {
    render(<ChatHeader title="Storage teams" />);

    expect(screen.getByRole('heading', { name: 'Storage teams' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'more options' })).not.toBeInTheDocument();
  });

  it('keeps the labelled History button and New chat for phones', () => {
    render(<ChatHeader showActions title="Storage teams" />);

    expect(screen.getByRole('button', { name: /History/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /New chat/ })).toBeInTheDocument();
  });
});

describe('LAB-2774: Delete from the title bar', () => {
  beforeAll(() => {
    HTMLDialogElement.prototype.showModal = jest.fn();
    HTMLDialogElement.prototype.close = jest.fn();
  });

  beforeEach(() => {
    push.mockClear();
    deleteThread.mockReset();
  });

  it('asks for confirmation, removes the chat and leaves the member on a new chat', async () => {
    deleteThread.mockResolvedValue(true);
    const onNewChat = jest.fn();
    document.addEventListener('new-chat', onNewChat);

    render(
      <>
        <AppSidebar isLoggedIn />
        <ChatHeader showActions title="Storage teams" />
      </>,
    );
    await screen.findAllByText('Storage teams');

    fireEvent.click(screen.getByRole('button', { name: 'more options' }));
    fireEvent.click(screen.getByText('Delete'));

    expect(trackMobileDeleteThread).toHaveBeenCalledWith('thread-1', 'Storage teams');
    const dialog = screen
      .getByText('Are you sure you want to delete this thread?')
      .closest('.delete-modal') as HTMLElement;
    expect(deleteThread).not.toHaveBeenCalled();

    await act(async () => {
      fireEvent.click(within(dialog).getByRole('button', { name: 'Delete', hidden: true }));
    });

    expect(deleteThread).toHaveBeenCalledWith('token', 'thread-1');
    expect(onNewChat).toHaveBeenCalled();
    expect(push).toHaveBeenCalledWith('/ai-search');
    document.removeEventListener('new-chat', onNewChat);
  });
});
