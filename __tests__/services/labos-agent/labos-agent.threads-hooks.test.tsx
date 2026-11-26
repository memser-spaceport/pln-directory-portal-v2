import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

import { useCurrentUserStore } from '@/services/auth/store';
import { LabosAgentQueryKeys } from '@/services/labos-agent/constants';
import { LabosAgentError } from '@/services/labos-agent/labos-agent.errors';
import {
  useDeleteLabosAgentThread,
  useLabosAgentThread,
  useLabosAgentThreads,
} from '@/services/labos-agent/hooks/useLabosAgentThreads';
import type { LabosAgentHistoryClient } from '@/types/labos-agent.types';

jest.mock('@tanstack/react-query', () => jest.requireActual('@tanstack/react-query'));

const history: jest.Mocked<LabosAgentHistoryClient> = {
  listThreads: jest.fn(),
  getThread: jest.fn(),
  deleteThread: jest.fn(),
  confirmDraft: jest.fn(),
};
jest.mock('@/services/labos-agent/labos-agent.history', () => ({ getLabosAgentHistoryClient: () => history }));

const row = (threadId: string) => ({
  threadId,
  title: threadId,
  source: 'agent' as const,
  createdAt: '2026-11-26T10:00:00.000Z',
  updatedAt: '2026-11-26T10:00:00.000Z',
});

let client: QueryClient;
const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={client}>{children}</QueryClientProvider>
);

beforeEach(() => {
  jest.clearAllMocks();
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  useCurrentUserStore.setState({ currentUser: { uid: 'me' } as never, isHydrated: true });
});

describe('LAB-3457: history hooks', () => {
  it('asks T1 only inside the gate, 20 rows a page, and loads more until the total', async () => {
    history.listThreads
      .mockResolvedValueOnce({ page: 1, limit: 20, total: 3, items: [row('t-1'), row('t-2')] })
      .mockResolvedValueOnce({ page: 2, limit: 20, total: 3, items: [row('t-2'), row('t-3')] });
    const outside = renderHook(() => useLabosAgentThreads({ enabled: false }), { wrapper });
    expect(outside.result.current.fetchStatus).toBe('idle');
    expect(history.listThreads).not.toHaveBeenCalled();

    const inside = renderHook(() => useLabosAgentThreads({ enabled: true }), { wrapper });
    await waitFor(() => expect(inside.result.current.rows).toHaveLength(2));
    expect(history.listThreads).toHaveBeenCalledWith({ page: 1, limit: 20 });
    expect(inside.result.current.hasNextPage).toBe(true);

    await act(() => inside.result.current.fetchNextPage());
    expect(history.listThreads).toHaveBeenLastCalledWith({ page: 2, limit: 20 });
    // t-2 moved to page 2 while paging: it shows once.
    await waitFor(() => expect(inside.result.current.rows.map((r) => r.threadId)).toEqual(['t-1', 't-2', 't-3']));
    expect(inside.result.current.hasNextPage).toBe(false);
  });

  it('T2 does not retry a THREAD_NOT_FOUND', async () => {
    client = new QueryClient();
    history.getThread.mockRejectedValue(new LabosAgentError(404, 'THREAD_NOT_FOUND', 'No'));
    const { result } = renderHook(() => useLabosAgentThread('gone', { enabled: true }), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(history.getThread).toHaveBeenCalledTimes(1);
  });

  it('delete drops the row from the cached list, also when T3 says it is gone already', async () => {
    const pages = (ids: string[]) => ({
      pages: [{ page: 1, limit: 20, total: ids.length, items: ids.map(row) }],
      pageParams: [1],
    });
    client.setQueryData([LabosAgentQueryKeys.THREADS, 'me'], pages(['t-1', 't-2']));
    history.deleteThread.mockRejectedValueOnce(new LabosAgentError(404, 'THREAD_NOT_FOUND', 'No'));
    const { result } = renderHook(() => useDeleteLabosAgentThread(), { wrapper });
    await act(() => result.current.mutateAsync('t-1'));
    expect(client.getQueryData([LabosAgentQueryKeys.THREADS, 'me'])).toMatchObject({
      pages: [{ total: 1, items: [{ threadId: 't-2' }] }],
    });

    history.deleteThread.mockRejectedValueOnce(new LabosAgentError(0, 'STREAM_FAILED', 'No'));
    await act(async () => {
      await expect(result.current.mutateAsync('t-2')).rejects.toMatchObject({ code: 'STREAM_FAILED' });
    });
    expect(client.getQueryData([LabosAgentQueryKeys.THREADS, 'me'])).toMatchObject({
      pages: [{ items: [{ threadId: 't-2' }] }],
    });
  });
});
