import { mockChatBody, mockLabosAgentClient } from '@/services/labos-agent/labos-agent.mock';
import { isStalledAnswer } from '@/services/labos-agent/labos-agent.errors';

const base = { threadId: 't', chatId: 'c', context: { page: 'news-story' as const, newsUid: 'n-1' } };

describe('LAB-3298: mock C1 client', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('answers about the story, with steps first and the full body last', async () => {
    const updates: Array<{ steps?: string[]; content?: string }> = [];
    const done = mockLabosAgentClient.chat(
      { ...base, message: 'Summarize this story' },
      { onUpdate: (p) => updates.push(p) },
    );
    await jest.runAllTimersAsync();
    const body = await done;

    expect(updates[0]).toEqual({ steps: ['Understanding the question'] });
    expect(body.steps).toContain('Reading the news story');
    expect(body.sourceRefs).toEqual([{ type: 'news', uid: 'n-1', title: 'This news story (mock)' }]);
    expect(body.proposals).toEqual([]);
  });

  it('uses web sources when the message asks for the web', () => {
    const body = mockChatBody({ ...base, message: 'Search the web for this' });
    expect(body.steps).toContain('Searching the web');
    expect(body.sources.length).toBeGreaterThan(0);
  });

  it('ends a "stall" answer with the stalled notice', () => {
    expect(isStalledAnswer(mockChatBody({ ...base, message: 'stall please' }).content)).toBe(true);
  });

  it('breaks the connection on "error"', async () => {
    const done = mockLabosAgentClient.chat({ ...base, message: 'error please' });
    const check = expect(done).rejects.toMatchObject({ code: 'STREAM_FAILED' });
    await jest.runAllTimersAsync();
    await check;
  });

  it('stops when the signal aborts', async () => {
    const controller = new AbortController();
    const done = mockLabosAgentClient.chat({ ...base, message: 'hi' }, { signal: controller.signal });
    controller.abort();
    await expect(done).rejects.toThrow('Aborted');
  });

  it('says yes to the access check', async () => {
    await expect(mockLabosAgentClient.getAccess()).resolves.toEqual({ enabled: true });
  });
});
