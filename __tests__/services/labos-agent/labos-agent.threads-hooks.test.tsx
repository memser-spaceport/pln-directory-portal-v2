import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

import { useCurrentUserStore } from '@/services/auth/store';
import { LabosAgentQueryKeys } from '@/services/labos-agent/constants';
import { LabosAgentError } from '@/services/labos-agent/labos-agent.errors';
import {
  useConfirmLabosAgentDraft,
  useDeleteLabosAgentThread,
  useLabosAgentThread,
  useLabosAgentThreads,
} from '@/services/labos-agent/hooks/useLabosAgentThreads';
import type { LabosAgentHistoryClient, LabosAgentThread } from '@/types/labos-agent.types';

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

const thread: LabosAgentThread = {
  ...row('t-1'),
  turns: [
    {
      kind: 'agent',
      chatId: 'c-1',
      question: 'Intro me to Ada',
      content: 'A draft.',
      sources: [],
      sourceRefs: [],
      followUpQuestions: [],
      actions: [],
      createdAt: null,
      steps: [],
      proposals: [],
      drafts: [
        {
          draftId: 'dr-1',
          kind: 'intro',
          target: { type: 'member', uid: 'm-2', name: 'Ada' },
          text: 'Hi Ada, an intro please.',
          minLength: 20,
          maxLength: 3500,
          source: 'agent',
          status: 'open',
        },
      ],
    },
  ],
};

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
  it('asks T1 only inside the gate', async () => {
    history.listThreads.mockResolvedValue({ page: 1, limit: 50, total: 1, items: [row('t-1')] });
    const outside = renderHook(() => useLabosAgentThreads({ enabled: false }), { wrapper });
    expect(outside.result.current.fetchStatus).toBe('idle');
    expect(history.listThreads).not.toHaveBeenCalled();

    const inside = renderHook(() => useLabosAgentThreads({ enabled: true }), { wrapper });
    await waitFor(() => expect(inside.result.current.data?.items).toHaveLength(1));
    expect(history.listThreads).toHaveBeenCalledWith({ page: 1, limit: 50 });
  });

  it('T2 does not retry a THREAD_NOT_FOUND', async () => {
    client = new QueryClient();
    history.getThread.mockRejectedValue(new LabosAgentError(404, 'THREAD_NOT_FOUND', 'No'));
    const { result } = renderHook(() => useLabosAgentThread('gone', { enabled: true }), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(history.getThread).toHaveBeenCalledTimes(1);
  });

  it('delete drops the row from the cached list, also when T3 says it is gone already', async () => {
    client.setQueryData([LabosAgentQueryKeys.THREADS, 'me'], {
      page: 1,
      limit: 50,
      total: 2,
      items: [row('t-1'), row('t-2')],
    });
    history.deleteThread.mockRejectedValueOnce(new LabosAgentError(404, 'THREAD_NOT_FOUND', 'No'));
    const { result } = renderHook(() => useDeleteLabosAgentThread(), { wrapper });
    await act(() => result.current.mutateAsync('t-1'));
    expect(client.getQueryData([LabosAgentQueryKeys.THREADS, 'me'])).toMatchObject({
      total: 1,
      items: [{ threadId: 't-2' }],
    });

    history.deleteThread.mockRejectedValueOnce(new LabosAgentError(0, 'STREAM_FAILED', 'No'));
    await act(async () => {
      await expect(result.current.mutateAsync('t-2')).rejects.toMatchObject({ code: 'STREAM_FAILED' });
    });
    expect(client.getQueryData([LabosAgentQueryKeys.THREADS, 'me'])).toMatchObject({ items: [{ threadId: 't-2' }] });
  });

  it('C5 marks the cached draft sent with the sent text', async () => {
    client.setQueryData([LabosAgentQueryKeys.THREAD, 'me', 't-1'], thread);
    history.confirmDraft.mockResolvedValue({ draftId: 'dr-1', status: 'sent', introRequestUid: 'ir-1' });
    const { result } = renderHook(() => useConfirmLabosAgentDraft(), { wrapper });
    await act(() =>
      result.current.mutateAsync({
        threadId: 't-1',
        draftId: 'dr-1',
        decision: 'send',
        text: ' Hi Ada, edited text. ',
      }),
    );
    const cached = client.getQueryData<LabosAgentThread>([LabosAgentQueryKeys.THREAD, 'me', 't-1']);
    const turn = cached?.turns[0];
    expect(turn?.kind === 'agent' && turn.drafts[0]).toMatchObject({
      status: 'sent',
      text: 'Hi Ada, edited text.',
      introRequestUid: 'ir-1',
    });
  });
});
