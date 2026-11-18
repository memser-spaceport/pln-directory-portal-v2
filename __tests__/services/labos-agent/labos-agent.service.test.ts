/**
 * @jest-environment node
 */
import { customFetch } from '@/utils/fetch-wrapper';
import {
  LabosAgentError,
  liveLabosAgentClient,
  normalizeChatBody,
  toChatContext,
  validateChatMessage,
} from '@/services/labos-agent/labos-agent.service';

jest.mock('@/utils/fetch-wrapper', () => ({ customFetch: jest.fn() }));

const mockedFetch = customFetch as jest.MockedFunction<typeof customFetch>;

function streamResponse(parts: string[], status = 200): Response {
  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      parts.forEach((p) => controller.enqueue(encoder.encode(p)));
      controller.close();
    },
  });
  return new Response(body, { status });
}

const jsonResponse = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

const request = {
  threadId: 't-1',
  chatId: 'c-1',
  message: '  What is new?  ',
  context: { page: 'news-story' as const, newsUid: 'n-1' },
};

describe('LAB-3298: LabOS agent C1 client', () => {
  beforeEach(() => mockedFetch.mockReset());

  it('sends only the contract fields as context', () => {
    expect(toChatContext({ page: 'news-story', newsUid: 'n-1', label: 'A story title' })).toEqual({
      page: 'news-story',
      newsUid: 'n-1',
    });
    expect(toChatContext({ page: 'home', label: 'Home' })).toEqual({ page: 'home' });
    expect(toChatContext(null)).toBeUndefined();
  });

  it('trims the message and rejects an empty or long message', () => {
    expect(validateChatMessage('  hi  ')).toBe('hi');
    expect(() => validateChatMessage('   ')).toThrow(LabosAgentError);
    expect(() => validateChatMessage('x'.repeat(2001))).toThrow(LabosAgentError);
  });

  it('drops unknown and half-written fields from a body', () => {
    expect(
      normalizeChatBody({ content: 'Hi', steps: ['a', 3], sourceRefs: [{ type: 'news', title: 'T' }, { uid: 'x' }] }),
    ).toEqual({
      steps: ['a'],
      content: 'Hi',
      sources: [],
      sourceRefs: [{ type: 'news', title: 'T' }],
      followUpQuestions: [],
      actions: [],
      proposals: [],
    });
  });

  it('posts the trimmed message to C1 and streams partial bodies', async () => {
    mockedFetch.mockResolvedValue(
      streamResponse([
        '{"steps":["Understanding the question"],"content":"Hel',
        'lo","sources":["https://a.example"]}',
      ]),
    );
    const updates: string[] = [];

    const body = await liveLabosAgentClient.chat(request, { onUpdate: (p) => updates.push(p.content ?? '') });

    const [url, init, withToken] = mockedFetch.mock.calls[0];
    expect(url).toMatch(/\/v1\/labos-agent\/chat$/);
    expect(withToken).toBe(true);
    expect(JSON.parse(init.body)).toEqual({ ...request, message: 'What is new?' });
    expect(updates[0]).toBe('Hel');
    expect(body.content).toBe('Hello');
    expect(body.sources).toEqual(['https://a.example']);
  });

  it.each([
    [403, { code: 'AGENT_NOT_ENABLED' }, 'AGENT_NOT_ENABLED'],
    [404, { code: 'NEWS_NOT_FOUND' }, 'NEWS_NOT_FOUND'],
    [400, { code: 'VALIDATION_ERROR' }, 'VALIDATION_ERROR'],
    [500, {}, 'UNKNOWN'],
  ])('maps a %s answer to %s', async (status, body, code) => {
    mockedFetch.mockResolvedValue(jsonResponse(body, status));
    await expect(liveLabosAgentClient.chat(request)).rejects.toMatchObject({ status, code });
  });

  it('maps 401 and keeps retryAfterSeconds on 429', async () => {
    mockedFetch.mockResolvedValueOnce(new Response(null, { status: 401 }));
    await expect(liveLabosAgentClient.chat(request)).rejects.toMatchObject({ code: 'UNAUTHORIZED' });

    mockedFetch.mockResolvedValueOnce(jsonResponse({ code: 'RATE_LIMITED', retryAfterSeconds: 30 }, 429));
    await expect(liveLabosAgentClient.chat(request)).rejects.toMatchObject({
      code: 'RATE_LIMITED',
      retryAfterSeconds: 30,
    });
  });

  it('reports a broken connection as STREAM_FAILED', async () => {
    mockedFetch.mockRejectedValue(new TypeError('network'));
    await expect(liveLabosAgentClient.chat(request)).rejects.toMatchObject({ code: 'STREAM_FAILED', status: 0 });
  });

  it('reads the access check and fails closed', async () => {
    mockedFetch.mockResolvedValueOnce(jsonResponse({ enabled: true }, 200));
    await expect(liveLabosAgentClient.getAccess()).resolves.toEqual({ enabled: true });

    mockedFetch.mockResolvedValueOnce(new Response(null, { status: 401 }));
    await expect(liveLabosAgentClient.getAccess()).resolves.toEqual({ enabled: false });
  });
});
