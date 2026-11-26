/**
 * @jest-environment node
 */
import { customFetch } from '@/utils/fetch-wrapper';
import {
  liveLabosAgentHistoryClient,
  normalizeThread,
  normalizeThreadList,
  normalizeThreadTurn,
} from '@/services/labos-agent/labos-agent.history';
import { mockLabosAgentHistoryClient, resetMockHistory } from '@/services/labos-agent/labos-agent.history.mock';
import { mockLabosAgentClient } from '@/services/labos-agent/labos-agent.mock';
import { LabosAgentError } from '@/services/labos-agent/labos-agent.errors';

jest.mock('@/utils/fetch-wrapper', () => ({ customFetch: jest.fn() }));

const mockedFetch = customFetch as jest.MockedFunction<typeof customFetch>;

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

const API = process.env.DIRECTORY_API_URL;

const proposal = {
  proposalId: 'ap_1',
  tool: 'update_my_profile',
  title: 'Update your bio',
  targetType: 'member',
  changes: [{ field: 'bio', label: 'Bio', oldValue: 'Old', newValue: 'New' }],
};
const draft = {
  draftId: 'dr_1',
  kind: 'intro',
  target: { type: 'member', uid: 'm-2', name: 'Ada' },
  text: 'Hi Ada, I would love an intro to talk about storage.',
  minLength: 20,
  maxLength: 3500,
  source: 'agent',
};

beforeEach(() => mockedFetch.mockReset());

describe('LAB-3457: T1 thread list', () => {
  it('asks for one page and reads the rows', async () => {
    mockedFetch.mockResolvedValue(
      jsonResponse({
        page: 1,
        limit: 50,
        total: 2,
        items: [
          {
            threadId: 't-agent',
            title: 'Intro to Ada',
            source: 'agent',
            context: { page: 'member', memberUid: 'm-2' },
            createdAt: '2026-11-25T10:00:00.000Z',
            updatedAt: '2026-11-26T10:00:00.000Z',
          },
          { threadId: 't-old', title: 'Storage teams', createdAt: '2026-11-01T10:00:00.000Z' },
        ],
      }),
    );
    const list = await liveLabosAgentHistoryClient.listThreads({ page: 1, limit: 50 });
    expect(mockedFetch).toHaveBeenCalledWith(`${API}/v1/labos-agent/threads?page=1&limit=50`, { method: 'GET' }, true);
    expect(list).toEqual({
      page: 1,
      limit: 50,
      total: 2,
      items: [
        {
          threadId: 't-agent',
          title: 'Intro to Ada',
          source: 'agent',
          context: { page: 'member', memberUid: 'm-2' },
          createdAt: '2026-11-25T10:00:00.000Z',
          updatedAt: '2026-11-26T10:00:00.000Z',
        },
        // No source: an old AI search thread. No updatedAt: the created time.
        {
          threadId: 't-old',
          title: 'Storage teams',
          source: 'ai-search',
          createdAt: '2026-11-01T10:00:00.000Z',
          updatedAt: '2026-11-01T10:00:00.000Z',
        },
      ],
    });
  });

  it('drops rows with no id and names a row with no title', () => {
    const list = normalizeThreadList({ items: [{ title: 'x' }, { threadId: 't', title: '  ' }, 'x'] });
    expect(list.items.map((i) => [i.threadId, i.title])).toEqual([['t', 'Untitled chat']]);
    expect(list.total).toBe(1);
  });

  it('a 403 outside the gate is AGENT_NOT_ENABLED', async () => {
    mockedFetch.mockResolvedValue(jsonResponse({ statusCode: 403, code: 'AGENT_NOT_ENABLED', message: 'No' }, 403));
    await expect(liveLabosAgentHistoryClient.listThreads()).rejects.toMatchObject({
      status: 403,
      code: 'AGENT_NOT_ENABLED',
    });
  });

  it('no response is a 401', async () => {
    mockedFetch.mockResolvedValue(undefined);
    await expect(liveLabosAgentHistoryClient.listThreads()).rejects.toMatchObject({
      status: 401,
      code: 'UNAUTHORIZED',
    });
  });
});

describe('LAB-3457: T2 thread turns', () => {
  it('reads an old AI search turn and a saved agent turn with its card states', async () => {
    mockedFetch.mockResolvedValue(
      jsonResponse({
        threadId: 't/1',
        title: 'Storage',
        source: 'ai-search',
        createdAt: '2026-11-01T10:00:00.000Z',
        updatedAt: '2026-11-26T10:00:00.000Z',
        turns: [
          {
            kind: 'ai-search',
            chatId: 'c1',
            question: 'Which teams work on storage?',
            content: 'Many.',
            sources: ['https://example.com/a'],
            followUpQuestions: ['Who leads them?'],
            actions: [{ type: 'team' }],
            createdAt: null,
            feedback: { rating: 1 },
          },
          {
            kind: 'agent',
            chatId: 'c2',
            question: 'Intro me to Ada',
            content: 'Here is a draft.',
            sources: [],
            followUpQuestions: [],
            actions: [],
            createdAt: '2026-11-26T10:00:00.000Z',
            steps: ['Reading the profile'],
            mentions: [
              { type: 'member', uid: 'm-2' },
              { type: 'page', page: 'nowhere' },
            ],
            toolCount: 2,
            proposals: [
              { ...proposal, status: 'done', summary: 'Saved.' },
              { ...proposal, proposalId: 'ap_2', status: 'weird' },
            ],
            drafts: [{ ...draft, status: 'sent', introRequestUid: 'ir-1', sentAt: '2026-11-26T10:01:00.000Z' }],
          },
        ],
      }),
    );
    const thread = await liveLabosAgentHistoryClient.getThread('t/1');
    expect(mockedFetch).toHaveBeenCalledWith(`${API}/v1/labos-agent/threads/t%2F1`, { method: 'GET' }, true);
    expect(thread.turns[0]).toEqual({
      kind: 'ai-search',
      chatId: 'c1',
      question: 'Which teams work on storage?',
      content: 'Many.',
      sources: ['https://example.com/a'],
      sourceRefs: [],
      followUpQuestions: ['Who leads them?'],
      actions: [{ type: 'team' }],
      sql: [],
      createdAt: null,
    });
    const agent = thread.turns[1];
    expect(agent.kind).toBe('agent');
    if (agent.kind !== 'agent') return;
    expect(agent.steps).toEqual(['Reading the profile']);
    expect(agent.mentions).toEqual([{ type: 'member', uid: 'm-2' }]);
    expect(agent.toolCount).toBe(2);
    // An unknown status never shows Confirm.
    expect(agent.proposals.map((p) => [p.proposalId, p.status, p.summary])).toEqual([
      ['ap_1', 'done', 'Saved.'],
      ['ap_2', 'expired', undefined],
    ]);
    expect(agent.drafts[0]).toMatchObject({ draftId: 'dr_1', status: 'sent', introRequestUid: 'ir-1' });
  });

  it('an old turn keeps its directory results, as `sql` or as husky `sqlData`', () => {
    const rows = [{ name: 'Acme', type: 'team', source: 'directory' }];
    expect(normalizeThreadTurn({ chatId: 'c', question: 'q', sql: rows })).toMatchObject({ sql: rows });
    expect(normalizeThreadTurn({ chatId: 'c', question: 'q', sqlData: rows })).toMatchObject({ sql: rows });
  });

  it('a turn with no kind is an old turn; a turn with no question drops out', () => {
    expect(normalizeThreadTurn({ chatId: 'c', question: 'q', content: 'a' })?.kind).toBe('ai-search');
    expect(normalizeThreadTurn({ chatId: 'c', content: 'a' })).toBeNull();
    expect(normalizeThread({ turns: 'x' }, 't').turns).toEqual([]);
  });

  it('a 404 is THREAD_NOT_FOUND', async () => {
    mockedFetch.mockResolvedValue(jsonResponse({ statusCode: 404, code: 'THREAD_NOT_FOUND', message: 'No' }, 404));
    await expect(liveLabosAgentHistoryClient.getThread('t')).rejects.toMatchObject({
      status: 404,
      code: 'THREAD_NOT_FOUND',
    });
  });
});

describe('LAB-3457: T3 delete and C5 draft confirm', () => {
  it('T3 sends a DELETE', async () => {
    mockedFetch.mockResolvedValue(jsonResponse({ threadId: 't', deleted: true }));
    await liveLabosAgentHistoryClient.deleteThread('t');
    expect(mockedFetch).toHaveBeenCalledWith(`${API}/v1/labos-agent/threads/t`, { method: 'DELETE' }, true);
  });

  it('C5 send goes with the trimmed text; cancel goes with no text', async () => {
    mockedFetch.mockResolvedValueOnce(jsonResponse({ draftId: 'dr_1', status: 'sent', introRequestUid: 'ir-1' }));
    await expect(
      liveLabosAgentHistoryClient.confirmDraft({
        threadId: 't',
        draftId: 'dr_1',
        decision: 'send',
        text: '  Hi Ada  ',
      }),
    ).resolves.toEqual({ draftId: 'dr_1', status: 'sent', introRequestUid: 'ir-1' });
    expect(mockedFetch.mock.calls[0][0]).toBe(`${API}/v1/labos-agent/drafts/confirm`);
    expect(JSON.parse(mockedFetch.mock.calls[0][1]?.body as string)).toEqual({
      threadId: 't',
      draftId: 'dr_1',
      decision: 'send',
      text: 'Hi Ada',
    });

    mockedFetch.mockResolvedValueOnce(jsonResponse({ draftId: 'dr_1', status: 'cancelled' }));
    await liveLabosAgentHistoryClient.confirmDraft({ threadId: 't', draftId: 'dr_1', decision: 'cancel', text: 'x' });
    expect(JSON.parse(mockedFetch.mock.calls[1][1]?.body as string)).toEqual({
      threadId: 't',
      draftId: 'dr_1',
      decision: 'cancel',
    });
  });

  it('a C5 409 DRAFT_CLOSED keeps how the draft closed', async () => {
    mockedFetch.mockResolvedValue(
      jsonResponse({ statusCode: 409, code: 'DRAFT_CLOSED', message: 'Closed', status: 'sent' }, 409),
    );
    const error = await liveLabosAgentHistoryClient
      .confirmDraft({ threadId: 't', draftId: 'dr_1', decision: 'send', text: 'Hi Ada, an intro please.' })
      .catch((e) => e);
    expect(error).toBeInstanceOf(LabosAgentError);
    expect(error).toMatchObject({ status: 409, code: 'DRAFT_CLOSED', draftStatus: 'sent' });
  });
});

describe('LAB-3457: the mock history', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    resetMockHistory();
  });
  afterEach(() => jest.useRealTimers());

  const run = async <T>(promise: Promise<T>): Promise<T> => {
    const settled = promise.then(
      (value) => ({ value }),
      (error) => ({ error }),
    );
    await jest.runAllTimersAsync();
    const result = (await settled) as { value?: T; error?: unknown };
    if ('error' in result) throw result.error;
    return result.value as T;
  };

  it('lists the old AI search thread and adds a turn sent with persist: true', async () => {
    const before = await run(mockLabosAgentHistoryClient.listThreads());
    expect(before.items.map((i) => i.source)).toEqual(['ai-search']);

    await run(mockLabosAgentClient.chat({ threadId: 'mt-1', chatId: 'c-1', message: 'Hello', persist: true }));
    await run(mockLabosAgentClient.chat({ threadId: 'mt-2', chatId: 'c-2', message: 'Not saved' }));

    const after = await run(mockLabosAgentHistoryClient.listThreads());
    expect(after.items.map((i) => [i.threadId, i.source])).toEqual([
      ['mt-1', 'agent'],
      ['mock-ai-search-thread', 'ai-search'],
    ]);
    const thread = await run(mockLabosAgentHistoryClient.getThread('mt-1'));
    expect(thread.turns).toHaveLength(1);
    expect(thread.turns[0]).toMatchObject({ kind: 'agent', question: 'Hello' });
  });

  it('deletes a thread; a deleted or missing thread is THREAD_NOT_FOUND', async () => {
    await run(mockLabosAgentHistoryClient.deleteThread('mock-ai-search-thread'));
    await expect(run(mockLabosAgentHistoryClient.getThread('mock-ai-search-thread'))).rejects.toMatchObject({
      code: 'THREAD_NOT_FOUND',
    });
    await expect(run(mockLabosAgentHistoryClient.getThread('missing-1'))).rejects.toMatchObject({
      code: 'THREAD_NOT_FOUND',
    });
  });
});
