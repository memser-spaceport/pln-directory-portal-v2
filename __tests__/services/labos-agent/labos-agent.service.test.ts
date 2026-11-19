/**
 * @jest-environment node
 */
import { customFetch } from '@/utils/fetch-wrapper';
import {
  LabosAgentError,
  liveLabosAgentClient,
  normalizeChatBody,
  normalizeDrafts,
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
      drafts: [],
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
    [404, { code: 'INTRO_TARGET_NOT_FOUND' }, 'INTRO_TARGET_NOT_FOUND'],
    [404, { code: 'MEMBER_NOT_FOUND' }, 'MEMBER_NOT_FOUND'],
    [404, { code: 'TEAM_NOT_FOUND' }, 'TEAM_NOT_FOUND'],
    [404, { code: 'JOB_NOT_FOUND' }, 'JOB_NOT_FOUND'],
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

describe('LAB-3300: intro context and drafts in C1', () => {
  const draft = {
    draftId: 'dr_1',
    kind: 'intro',
    target: { type: 'team', uid: 't-1', name: 'Acme' },
    text: '  I lead fundraising at Acme and want advice.  ',
    minLength: 20,
    maxLength: 3500,
    source: 'agent',
  };

  it('sends page intro with introTarget only (no label, no entry point)', () => {
    expect(
      toChatContext({
        page: 'intro',
        introTarget: { type: 'member', uid: 'm-1' },
        label: 'Intro to Ada',
        entryPoint: 'member-header',
      }),
    ).toEqual({ page: 'intro', introTarget: { type: 'member', uid: 'm-1' } });
  });

  it('keeps a whole draft, trims its text and reads drafts from the body', () => {
    expect(normalizeDrafts([draft])).toEqual([{ ...draft, text: 'I lead fundraising at Acme and want advice.' }]);
    expect(normalizeChatBody({ content: 'Hi', drafts: [draft] }).drafts).toHaveLength(1);
    expect(normalizeChatBody({ content: 'Hi' }).drafts).toEqual([]);
  });

  it('drops a half-streamed or unknown draft', () => {
    expect(
      normalizeDrafts([
        { ...draft, draftId: '' },
        { ...draft, kind: 'job-application' },
        { ...draft, target: { type: 'team', uid: 't-1' } },
        { ...draft, target: { type: 'project', uid: 'p', name: 'P' } },
        { draftId: 'dr_2', kind: 'intro' },
        null,
      ]),
    ).toEqual([]);
  });

  it('never allows limits wider than the modal (20 to 3500)', () => {
    const [d] = normalizeDrafts([{ ...draft, minLength: 1, maxLength: 9000 }]);
    expect(d.minLength).toBe(20);
    expect(d.maxLength).toBe(3500);
    const [e] = normalizeDrafts([{ ...draft, minLength: undefined, maxLength: 'x' }]);
    expect([e.minLength, e.maxLength]).toEqual([20, 3500]);
  });

  describe('LAB-3302: S5 page context in the C1 body', () => {
    beforeEach(() => mockedFetch.mockReset());

    it.each([
      [
        { page: 'member', memberUid: 'm-2', label: 'Member profile' },
        { page: 'member', memberUid: 'm-2' },
      ],
      [
        { page: 'team', teamUid: 't-1', label: 'Team page' },
        { page: 'team', teamUid: 't-1' },
      ],
      [
        { page: 'job', jobUid: 'j-1', label: 'Job post' },
        { page: 'job', jobUid: 'j-1' },
      ],
      [{ page: 'job', label: 'Jobs' }, { page: 'job' }],
      [{ page: 'profile', label: 'Your profile' }, { page: 'profile' }],
    ] as const)('S5-C30: the fetch body for %o has only the page and its id', async (open, wire) => {
      mockedFetch.mockResolvedValue(streamResponse(['{"content":"Hi"}']));
      await liveLabosAgentClient.chat({ threadId: 't-1', chatId: 'c-1', message: 'Hi', context: toChatContext(open) });

      const sent = JSON.parse(mockedFetch.mock.calls[0][1].body).context;
      expect(sent).toEqual(wire);
      expect(sent).not.toHaveProperty('label');
      expect(sent).not.toHaveProperty('entryPoint');
    });

    it('S5-C30: an intro context keeps the entry point and the label out of the body', async () => {
      mockedFetch.mockResolvedValue(streamResponse(['{"content":"Hi"}']));
      const open = {
        page: 'intro',
        introTarget: { type: 'team', uid: 't-1' },
        label: 'Team page',
        entryPoint: 'team-header',
      } as const;
      await liveLabosAgentClient.chat({ threadId: 't-1', chatId: 'c-1', message: 'Hi', context: toChatContext(open) });

      expect(JSON.parse(mockedFetch.mock.calls[0][1].body).context).toEqual({
        page: 'intro',
        introTarget: { type: 'team', uid: 't-1' },
      });
    });
  });
});
