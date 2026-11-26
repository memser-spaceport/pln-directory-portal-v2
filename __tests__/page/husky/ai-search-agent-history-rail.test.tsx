import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import type { LabosAgentHistoryClient, LabosAgentThreadListItem } from '@/types/labos-agent.types';

/**
 * LAB-3457: for a member inside the agent gate, the History rail is the shared history (T1): old AI search chats and
 * agent chats in one list, with "Load more" and delete through T3. AI search's own list is not read.
 */
const push = jest.fn();
const replace = jest.fn();
const getHuskyHistory = jest.fn();
const huskyDelete = jest.fn();
let mockParams: { id?: string } = {};
let mockAccess: 'on' | 'off' | 'unknown' = 'on';

jest.mock('@/services/labos-agent/hooks/useLabosAgentAccess', () => ({
  useLabosAgentAccessState: () => mockAccess,
  useLabosAgentAccess: () => mockAccess === 'on',
}));

const history: jest.Mocked<LabosAgentHistoryClient> = {
  listThreads: jest.fn(),
  getThread: jest.fn(),
  deleteThread: jest.fn(),
  confirmDraft: jest.fn(),
};
jest.mock('@/services/labos-agent/labos-agent.history', () => ({ getLabosAgentHistoryClient: () => history }));

jest.mock('next/navigation', () => ({
  useParams: () => mockParams,
  useRouter: () => ({ push, replace }),
  usePathname: () => '/ai-search',
  useSearchParams: () => new URLSearchParams(),
}));
jest.mock('@/analytics/husky.analytics', () => ({
  useHuskyAnalytics: () => new Proxy({}, { get: () => jest.fn() }),
}));
jest.mock('@/components/core/login/utils', () => ({ useLoginRedirect: () => jest.fn() }));
jest.mock('@/utils/auth.utils', () => ({ getUserCredentials: async () => ({ authToken: 'token' }) }));
jest.mock('@/utils/common.utils', () => ({
  ...jest.requireActual('@/utils/common.utils'),
  triggerLoader: jest.fn(),
}));
jest.mock('@/services/husky.service', () => ({
  getHuskyHistory: (...args: unknown[]) => getHuskyHistory(...args),
  deleteThread: (...args: unknown[]) => huskyDelete(...args),
}));
const toast = { loading: jest.fn(() => 'toast-id'), update: jest.fn() };
jest.mock('react-toastify', () => ({ toast }));
jest.mock('@tanstack/react-query', () => jest.requireActual('@tanstack/react-query'));

import { SidebarProvider } from '@/components/page/husky/SidebarProvider';
import { AppSidebar } from '@/components/page/husky/AppSidebar';
import { useCurrentUserStore } from '@/services/auth/store';
import type { IUserInfo } from '@/types/shared.types';

const now = new Date();
const row = (threadId: string, title: string, source: 'agent' | 'ai-search' = 'agent'): LabosAgentThreadListItem => ({
  threadId,
  title,
  source,
  createdAt: now.toISOString(),
  updatedAt: now.toISOString(),
});

const renderRail = () => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <SidebarProvider>
        <AppSidebar isLoggedIn />
      </SidebarProvider>
    </QueryClientProvider>,
  );
};

beforeEach(() => {
  jest.clearAllMocks();
  mockParams = {};
  mockAccess = 'on';
  useCurrentUserStore.setState({ currentUser: { uid: 'me' } as IUserInfo, isHydrated: true });
  history.listThreads.mockResolvedValue({
    page: 1,
    limit: 20,
    total: 2,
    items: [row('t-agent', 'Intro to Ada'), row('t-old', 'Storage teams', 'ai-search')],
  });
  history.deleteThread.mockResolvedValue(undefined);
  getHuskyHistory.mockResolvedValue([row('t-husky', 'From AI search only')]);
});

describe('LAB-3457: the History rail inside the agent gate', () => {
  it('lists agent chats and old AI search chats from T1, grouped by date, and never reads AI search’s list', async () => {
    renderRail();
    expect(await screen.findByText('Intro to Ada')).toBeInTheDocument();
    expect(screen.getByText('Storage teams')).toBeInTheDocument();
    expect(screen.getByText('Today')).toBeInTheDocument();
    expect(history.listThreads).toHaveBeenCalledWith({ page: 1, limit: 20 });
    expect(getHuskyHistory).not.toHaveBeenCalled();
    expect(screen.queryByText('From AI search only')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Load more chats' })).not.toBeInTheDocument();
  });

  it('loads the next page with Load more chats, until the total', async () => {
    history.listThreads
      .mockResolvedValueOnce({ page: 1, limit: 20, total: 3, items: [row('t-1', 'First chat'), row('t-2', 'Second')] })
      .mockResolvedValueOnce({ page: 2, limit: 20, total: 3, items: [row('t-3', 'Third chat')] });
    renderRail();
    fireEvent.click(await screen.findByRole('button', { name: 'Load more chats' }));
    expect(await screen.findByText('Third chat')).toBeInTheDocument();
    expect(history.listThreads).toHaveBeenLastCalledWith({ page: 2, limit: 20 });
    expect(screen.queryByRole('button', { name: 'Load more chats' })).not.toBeInTheDocument();
  });

  it('deletes with T3, not AI search’s delete; the open chat leaves for a new chat', async () => {
    mockParams = { id: 't-agent' };
    const newChat = jest.fn();
    document.addEventListener('new-chat', newChat);
    renderRail();
    const rowEl = (await screen.findByText('Intro to Ada')).closest('li') as HTMLElement;
    expect(rowEl).toHaveAttribute('data-active', 'true');

    history.listThreads.mockResolvedValue({ page: 1, limit: 20, total: 1, items: [row('t-old', 'Storage teams')] });
    fireEvent.click(within(rowEl).getByRole('button', { hidden: true }));
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

    await waitFor(() => expect(history.deleteThread).toHaveBeenCalledWith('t-agent'));
    expect(huskyDelete).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.queryByText('Intro to Ada')).not.toBeInTheDocument());
    expect(newChat).toHaveBeenCalled();
    expect(push).toHaveBeenCalledWith('/ai-search');
    expect(toast.update).toHaveBeenCalledWith('toast-id', expect.objectContaining({ type: 'success' }));
    document.removeEventListener('new-chat', newChat);
  });

  it('a failed T3 keeps the row and says so', async () => {
    history.deleteThread.mockRejectedValue(new Error('down'));
    renderRail();
    const rowEl = (await screen.findByText('Intro to Ada')).closest('li') as HTMLElement;
    fireEvent.click(within(rowEl).getByRole('button', { hidden: true }));
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

    await waitFor(() =>
      expect(toast.update).toHaveBeenCalledWith('toast-id', expect.objectContaining({ type: 'error' })),
    );
    expect(screen.getByText('Intro to Ada')).toBeInTheDocument();
  });

  it('marks a new chat’s row open once the agent page announces its saved thread', async () => {
    renderRail();
    await screen.findByText('Intro to Ada');
    act(() => {
      document.dispatchEvent(new CustomEvent('refresh-husky-history', { detail: { openThreadId: 't-agent' } }));
    });
    await waitFor(() => expect(screen.getByText('Intro to Ada').closest('li')).toHaveAttribute('data-active', 'true'));
  });

  it('while the gate has not answered, the rail asks neither list', async () => {
    mockAccess = 'unknown';
    renderRail();
    await act(async () => {});
    expect(history.listThreads).not.toHaveBeenCalled();
    expect(getHuskyHistory).not.toHaveBeenCalled();
  });

  it('outside the gate the rail keeps AI search’s own list', async () => {
    mockAccess = 'off';
    renderRail();
    expect(await screen.findByText('From AI search only')).toBeInTheDocument();
    expect(history.listThreads).not.toHaveBeenCalled();
  });
});
