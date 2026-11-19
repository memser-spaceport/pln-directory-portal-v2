/**
 * @jest-environment node
 */
import { customFetch } from '@/utils/fetch-wrapper';
import {
  LabosAgentError,
  liveLabosAgentClient,
  normalizeMentionsBody,
} from '@/services/labos-agent/labos-agent.service';
import {
  contextMentionKey,
  mentionKey,
  pickerGroups,
  readAtQuery,
  replaceAtQuery,
  toChatMentions,
} from '@/services/labos-agent/labos-agent.mentions';
import { MOCK_MENTIONS, mockLabosAgentClient, mockMentions } from '@/services/labos-agent/labos-agent.mock';
import type { LabosAgentMentionChip, LabosAgentMentionsResponse } from '@/types/labos-agent.types';

jest.mock('@/utils/fetch-wrapper', () => ({ customFetch: jest.fn() }));

const mockedFetch = customFetch as jest.MockedFunction<typeof customFetch>;

const jsonResponse = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

const streamResponse = (text: string) =>
  new Response(
    new ReadableStream<Uint8Array>({
      start(c) {
        c.enqueue(new TextEncoder().encode(text));
        c.close();
      },
    }),
    { status: 200 },
  );

/** Mock rows only (S6-F22). */
const response: LabosAgentMentionsResponse = {
  q: 'mock',
  members: [{ type: 'member', uid: 'm-1', name: 'Ada Mock', imageUrl: null, teamName: 'Mock Labs', role: 'Founder' }],
  teams: [{ type: 'team', uid: 't-1', name: 'Mock Labs', logoUrl: null, shortDescription: 'A mock team.' }],
  news: [
    {
      type: 'news',
      uid: 'n-1',
      title: 'Mock Labs raises a mock round',
      teamUid: 't-1',
      teamName: 'Mock Labs',
      eventDate: '2026-11-12T00:00:00.000Z',
    },
  ],
};

const chip = (key: string, mention: LabosAgentMentionChip['mention'], label = key): LabosAgentMentionChip => ({
  key,
  label,
  kind: mention.type === 'page' ? 'page' : mention.type,
  mention,
});

describe('LAB-3318: @ query rules (S6-F1, S6-F2, S6-F10)', () => {
  it('S6-F1: @ at the start or after a space opens, and the text after it is the query', () => {
    expect(readAtQuery('@', 1)).toEqual({ query: '', start: 0 });
    expect(readAtQuery('hi @ad', 6)).toEqual({ query: 'ad', start: 3 });
    expect(readAtQuery('hi\n@mock', 8)).toEqual({ query: 'mock', start: 3 });
  });

  it('S6-F1: @ inside a word does not open, and the query is up to 30 characters', () => {
    expect(readAtQuery('mail@ada', 8)).toBeNull();
    expect(readAtQuery(`@${'a'.repeat(30)}`, 31)).toEqual({ query: 'a'.repeat(30), start: 0 });
    expect(readAtQuery(`@${'a'.repeat(31)}`, 32)).toBeNull();
  });

  it('S6-F2: a space after the query or a deleted @ closes', () => {
    expect(readAtQuery('@ada ', 5)).toBeNull();
    expect(readAtQuery('ada', 3)).toBeNull();
  });

  it('S6-F10: a pick puts @<name> and a space in the place of @<query>', () => {
    expect(replaceAtQuery('Ask @ad about it', 4, 'ad', 'Ada Mock')).toEqual({
      value: 'Ask @Ada Mock about it',
      caret: 14,
    });
    expect(replaceAtQuery('@', 0, '', 'Home')).toEqual({ value: '@Home ', caret: 6 });
  });
});

describe('LAB-3318: picker groups (S6-F6, S6-F7, S6-F11)', () => {
  it('S6-F6: the order is Pages, News, Teams, Members', () => {
    const groups = pickerGroups({ query: '', response, taken: new Set(), currentPageLabel: null });
    expect(groups.map((g) => g.kind)).toEqual(['page', 'news', 'team', 'member']);
  });

  it('S6-F6: an empty group does not show', () => {
    const groups = pickerGroups({
      query: 'mock',
      response: { ...response, members: [], teams: [] },
      taken: new Set(),
      currentPageLabel: null,
    });
    expect(groups.map((g) => g.kind)).toEqual(['news']);
  });

  it('S6-F7: the pages are Home, Jobs and Your profile, and the current page only after its chip is gone', () => {
    const off = pickerGroups({ query: '', response: null, taken: new Set(), currentPageLabel: null });
    expect(off[0].items.map((i) => i.label)).toEqual(['Home', 'Jobs', 'Your profile']);
    const removed = pickerGroups({ query: '', response: null, taken: new Set(), currentPageLabel: 'Team page' });
    expect(removed[0].items.map((i) => i.label)).toEqual(['Team page', 'Home', 'Jobs', 'Your profile']);
    expect(removed[0].items[0].restoresPage).toBe(true);
    expect(removed[0].items[0].mention).toBeUndefined();
  });

  it('S6-F7: the pages filter on the query in the browser', () => {
    const groups = pickerGroups({ query: 'jo', response: null, taken: new Set(), currentPageLabel: null });
    expect(groups[0].items.map((i) => i.label)).toEqual(['Jobs']);
  });

  it('S6-F11: an item with a chip does not show, also the item of the page chip', () => {
    const taken = new Set(['team:t-1', contextMentionKey({ page: 'home' })!]);
    const groups = pickerGroups({ query: '', response, taken, currentPageLabel: null });
    expect(groups.flatMap((g) => g.items.map((i) => i.key))).toEqual([
      'page:job',
      'page:profile',
      'news:n-1',
      'member:m-1',
    ]);
  });

  it('S6-F11: the page chip key matches the mention key of the same item', () => {
    expect(contextMentionKey({ page: 'news-story', newsUid: 'n-1' })).toBe(mentionKey({ type: 'news', uid: 'n-1' }));
    expect(contextMentionKey({ page: 'team', teamUid: 't-1' })).toBe('team:t-1');
    expect(contextMentionKey({ page: 'member', memberUid: 'm-1' })).toBe('member:m-1');
    expect(contextMentionKey({ page: 'profile' })).toBe('page:profile');
    expect(contextMentionKey({ page: 'job' })).toBe('page:job');
    expect(contextMentionKey({ page: 'job', jobUid: 'j-1' })).toBeNull();
    expect(contextMentionKey(null)).toBeNull();
  });
});

describe('LAB-3318: C1 mentions (S6-F14)', () => {
  beforeEach(() => mockedFetch.mockReset());

  it('S6-F14: keeps the chip order with only type and uid, or type and page, and no label', () => {
    const chips = [
      chip('team:t-1', { type: 'team', uid: 't-1' }, 'Mock Labs'),
      chip('page:job', { type: 'page', page: 'job' }, 'Jobs'),
      { ...chip('member:m-1', { type: 'member', uid: 'm-1' }, 'Ada Mock'), failed: true as const },
      chip('news:n-1', { type: 'news', uid: 'n-1' }, 'Mock story'),
    ];
    expect(toChatMentions(chips)).toEqual([
      { type: 'team', uid: 't-1' },
      { type: 'page', page: 'job' },
      { type: 'member', uid: 'm-1' },
      { type: 'news', uid: 'n-1' },
    ]);
    expect(toChatMentions([])).toBeUndefined();
  });

  it('S6-F14: drops a second chip with the same key and sends at most 5', () => {
    const chips = Array.from({ length: 7 }, (_, i) => chip(`team:t-${i % 6}`, { type: 'team', uid: `t-${i % 6}` }));
    const sent = toChatMentions(chips)!;
    expect(sent).toHaveLength(5);
    expect(new Set(sent.map(mentionKey)).size).toBe(5);
  });

  it('S6-F14: drops a second chip with the same mention key, keeps the first one and the order (Oleg)', () => {
    const chips = [
      chip('team:t-1', { type: 'team', uid: 't-1' }, 'Mock Labs'),
      chip('page:job', { type: 'page', page: 'job' }, 'Jobs'),
      chip('team:t-1', { type: 'team', uid: 't-1' }, 'Mock Labs'),
      chip('member:m-1', { type: 'member', uid: 'm-1' }, 'Ada Mock'),
      // Same mention under another chip key: the mention key decides.
      chip('page:job:again', { type: 'page', page: 'job' }, 'Jobs'),
    ];
    expect(toChatMentions(chips)).toEqual([
      { type: 'team', uid: 't-1' },
      { type: 'page', page: 'job' },
      { type: 'member', uid: 'm-1' },
    ]);
    // A member and a team with the same uid are 2 mentions.
    expect(
      toChatMentions([
        chip('team:x-1', { type: 'team', uid: 'x-1' }),
        chip('member:x-1', { type: 'member', uid: 'x-1' }),
      ]),
    ).toEqual([
      { type: 'team', uid: 'x-1' },
      { type: 'member', uid: 'x-1' },
    ]);
  });

  it('S6-F14: the fetch body has `mentions` next to `context`, and no `mentions` key when there are none', async () => {
    mockedFetch.mockResolvedValue(streamResponse('{"content":"ok"}'));
    await liveLabosAgentClient.chat({
      threadId: 't',
      chatId: 'c',
      message: 'Ask @Mock Labs',
      context: { page: 'home' },
      mentions: [{ type: 'team', uid: 't-1' }],
    });
    expect(JSON.parse(mockedFetch.mock.calls[0][1].body)).toEqual({
      threadId: 't',
      chatId: 'c',
      message: 'Ask @Mock Labs',
      context: { page: 'home' },
      mentions: [{ type: 'team', uid: 't-1' }],
    });

    mockedFetch.mockResolvedValue(streamResponse('{"content":"ok"}'));
    await liveLabosAgentClient.chat({ threadId: 't', chatId: 'c', message: 'Hi', mentions: [] });
    expect(JSON.parse(mockedFetch.mock.calls[1][1].body)).toEqual({ threadId: 't', chatId: 'c', message: 'Hi' });
  });

  it('S6-F17: a C1 404 for a mention keeps `mentionIndex`; a 404 for context has none', async () => {
    mockedFetch.mockResolvedValue(
      jsonResponse({ statusCode: 404, code: 'TEAM_NOT_FOUND', message: 'Team not found', mentionIndex: 1 }, 404),
    );
    const err = await liveLabosAgentClient
      .chat({ threadId: 't', chatId: 'c', message: 'Hi', mentions: [{ type: 'team', uid: 't-1' }] })
      .catch((e) => e);
    expect(err).toBeInstanceOf(LabosAgentError);
    expect(err).toMatchObject({ status: 404, code: 'TEAM_NOT_FOUND', mentionIndex: 1 });

    mockedFetch.mockResolvedValue(jsonResponse({ statusCode: 404, code: 'TEAM_NOT_FOUND', message: 'x' }, 404));
    const pageErr = await liveLabosAgentClient
      .chat({ threadId: 't', chatId: 'c', message: 'Hi', context: { page: 'team', teamUid: 't-1' } })
      .catch((e) => e);
    expect(pageErr.mentionIndex).toBeUndefined();
  });
});

describe('LAB-3318: C4 client (S6-F16, S6-F23)', () => {
  beforeEach(() => mockedFetch.mockReset());

  it('calls GET /v1/labos-agent/mentions with the trimmed q', async () => {
    mockedFetch.mockResolvedValue(jsonResponse(response, 200));
    const res = await liveLabosAgentClient.searchMentions({ q: '  mock ' });
    const [url, init, withToken] = mockedFetch.mock.calls[0];
    expect(url).toMatch(/\/v1\/labos-agent\/mentions\?q=mock$/);
    expect(init).toMatchObject({ method: 'GET' });
    expect(withToken).toBe(true);
    expect(res).toEqual(response);
  });

  it('sends types and limit when the caller sets them', async () => {
    mockedFetch.mockResolvedValue(jsonResponse(response, 200));
    await liveLabosAgentClient.searchMentions({ q: '', types: ['team', 'news'], limit: 3 });
    expect(mockedFetch.mock.calls[0][0]).toMatch(/mentions\?q=&types=team%2Cnews&limit=3$/);
  });

  it.each([400, 403, 429, 500])('S6-F16: a %i is a LabosAgentError', async (status) => {
    mockedFetch.mockResolvedValue(jsonResponse({ statusCode: status, code: 'VALIDATION_ERROR' }, status));
    await expect(liveLabosAgentClient.searchMentions({ q: 'x' })).rejects.toBeInstanceOf(LabosAgentError);
  });

  it('S6-F16: a network error is a LabosAgentError', async () => {
    mockedFetch.mockRejectedValue(new TypeError('Failed to fetch'));
    await expect(liveLabosAgentClient.searchMentions({ q: 'x' })).rejects.toMatchObject({ code: 'STREAM_FAILED' });
  });

  it('drops rows with no uid or name, and keeps each key present', () => {
    expect(
      normalizeMentionsBody({ q: 'a', members: [{ uid: 'm' }, { uid: 'm-2', name: 'B', email: 'x' }] }, 'a'),
    ).toEqual({
      q: 'a',
      members: [{ type: 'member', uid: 'm-2', name: 'B', imageUrl: null, teamName: null, role: null }],
      teams: [],
      news: [],
    });
  });
});

describe('LAB-3318: mock client (S6-F21, S6-F22)', () => {
  it('S6-F21: the mock answers C4 with the default list for an empty query', async () => {
    const res = await mockLabosAgentClient.searchMentions({ q: '' });
    expect(res.q).toBe('');
    expect(res.members).toEqual([]);
    expect(res.teams.length).toBeGreaterThan(0);
    expect(res.news.length).toBeGreaterThan(0);
  });

  it('S6-F21: the mock filters on q and gives an error for "unavailable"', async () => {
    expect(mockMentions({ q: 'ada' }).members.map((m) => m.name)).toEqual(['Ada Mock']);
    await expect(mockLabosAgentClient.searchMentions({ q: 'unavailable' })).rejects.toBeInstanceOf(LabosAgentError);
  });

  it('S6-F21: the mock C1 accepts mentions and names them in the answer', async () => {
    const res = await mockLabosAgentClient.chat({
      threadId: 't',
      chatId: 'c',
      message: 'Compare @Mock Labs and @Jobs',
      mentions: [
        { type: 'team', uid: 'mock-team-labs' },
        { type: 'page', page: 'job' },
      ],
    });
    expect(res.steps).toContain('Reading the items you added');
    expect(res.content).toContain('1. team mock-team-labs');
    expect(res.content).toContain('2. the job page');
  }, 10000);

  it('S6-F21: a mention uid that starts with "missing" gives a 404 with mentionIndex', async () => {
    const err = await mockLabosAgentClient
      .chat({
        threadId: 't',
        chatId: 'c',
        message: 'Hi',
        mentions: [
          { type: 'page', page: 'home' },
          { type: 'member', uid: 'missing-member' },
        ],
      })
      .catch((e) => e);
    expect(err).toMatchObject({ status: 404, code: 'MEMBER_NOT_FOUND', mentionIndex: 1 });
  });

  it('S6-F22: the mock rows have mock names and no email, phone or handle keys', () => {
    const rows = [...MOCK_MENTIONS.members, ...MOCK_MENTIONS.teams, ...MOCK_MENTIONS.news];
    rows.forEach((row) => {
      expect(Object.keys(row)).not.toEqual(expect.arrayContaining(['email']));
      expect(JSON.stringify(row)).toMatch(/[Mm]ock|Sample|missing/);
    });
    MOCK_MENTIONS.members.forEach((m) =>
      expect(Object.keys(m).sort()).toEqual(['imageUrl', 'name', 'role', 'teamName', 'type', 'uid']),
    );
  });
});
