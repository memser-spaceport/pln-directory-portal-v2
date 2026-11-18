import {
  MOCK_INTRO_REFUSAL,
  MOCK_INTRO_TARGET_NAME,
  mockChatBody,
  mockLabosAgentClient,
} from '@/services/labos-agent/labos-agent.mock';
import { LabosAgentError } from '@/services/labos-agent/labos-agent.errors';
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

describe('LAB-3299: mock C2 actions', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  const confirm = async (proposalId: string, decision: 'confirm' | 'cancel' = 'confirm') => {
    const done = mockLabosAgentClient.confirmAction({ proposalId, decision }).catch((e) => e);
    await jest.runAllTimersAsync();
    return done;
  };

  it('proposes one profile edit for "edit profile" and one team edit for "edit team"', () => {
    const profile = mockChatBody({ ...base, message: 'Please edit profile bio' }).proposals;
    expect(profile).toHaveLength(1);
    expect(profile[0]).toMatchObject({ tool: 'update_my_profile', targetType: 'member' });
    const team = mockChatBody({ ...base, message: 'edit team description' }).proposals;
    expect(team).toHaveLength(1);
    expect(team[0]).toMatchObject({ tool: 'update_team', targetType: 'team' });
    expect(mockChatBody({ ...base, message: 'Summarize' }).proposals).toEqual([]);
  });

  it('confirms, cancels and gives a 403 for "forbidden"', async () => {
    const [p] = mockChatBody({ ...base, chatId: 'c-ok', message: 'edit profile' }).proposals;
    await expect(confirm(p.proposalId)).resolves.toMatchObject({ status: 'done' });
    const [c] = mockChatBody({ ...base, chatId: 'c-cancel', message: 'edit profile' }).proposals;
    await expect(confirm(c.proposalId, 'cancel')).resolves.toMatchObject({ status: 'cancelled' });

    const [f] = mockChatBody({ ...base, message: 'forbidden' }).proposals;
    const err = await confirm(f.proposalId);
    expect(err).toBeInstanceOf(LabosAgentError);
    expect(err).toMatchObject({ status: 403, code: 'ACTION_NOT_ALLOWED' });
  });

  it('fails the first save for "save fails", then saves', async () => {
    const [p] = mockChatBody({ ...base, chatId: 'c-fail', message: 'edit profile, save fails' }).proposals;
    await expect(confirm(p.proposalId)).resolves.toMatchObject({ status: 0 });
    await expect(confirm(p.proposalId)).resolves.toMatchObject({ status: 'done' });
  });

  it('gives a 409 with the stored status on a second call, like the backend', async () => {
    const [done] = mockChatBody({ ...base, chatId: 'c-409-done', message: 'edit profile' }).proposals;
    await confirm(done.proposalId);
    await expect(confirm(done.proposalId)).resolves.toMatchObject({
      status: 409,
      code: 'PROPOSAL_CLOSED',
      closedStatus: 'done',
    });

    const [cancelled] = mockChatBody({ ...base, chatId: 'c-409-cancel', message: 'edit profile' }).proposals;
    await confirm(cancelled.proposalId, 'cancel');
    await expect(confirm(cancelled.proposalId)).resolves.toMatchObject({ closedStatus: 'cancelled' });
  });

  it('sends bio as HTML, like the real profile field', () => {
    const [p] = mockChatBody({ ...base, message: 'edit profile' }).proposals;
    expect(p.changes.find((c) => c.field === 'bio')?.newValue).toMatch(/<p>/);
  });
});

describe('LAB-3300: mock intro drafts', () => {
  const intro = (uid = 'm-1') => ({
    threadId: 't',
    chatId: 'c',
    context: { page: 'intro' as const, introTarget: { type: 'member' as const, uid } },
  });

  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('gives one intro draft for the context target', () => {
    const body = mockChatBody({ ...intro(), message: 'Help me write an intro request to Mock Member.' });
    expect(body.drafts).toHaveLength(1);
    expect(body.drafts[0]).toMatchObject({
      kind: 'intro',
      target: { type: 'member', uid: 'm-1', name: MOCK_INTRO_TARGET_NAME },
      minLength: 20,
      maxLength: 3500,
      source: 'agent',
    });
    expect(body.drafts[0].text.length).toBeGreaterThanOrEqual(20);
    expect(body.proposals).toEqual([]);
  });

  it('refuses with drafts: [] for "not eligible"', () => {
    const body = mockChatBody({ ...intro(), message: 'not eligible' });
    expect(body.drafts).toEqual([]);
    expect(body.content).toBe(MOCK_INTRO_REFUSAL);
  });

  it('gives no drafts outside the intro context', () => {
    expect(mockChatBody({ ...base, message: 'Summarize this story' }).drafts).toEqual([]);
  });

  it('gives a 404 INTRO_TARGET_NOT_FOUND for a missing target', async () => {
    const done = mockLabosAgentClient.chat({ ...intro('missing-1'), message: 'Help me' });
    const check = expect(done).rejects.toMatchObject({ status: 404, code: 'INTRO_TARGET_NOT_FOUND' });
    await jest.runAllTimersAsync();
    await check;
  });
});

describe('LAB-3302: mock C1 for the S5 pages', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  const req = (context: Parameters<typeof mockChatBody>[0]['context']) => ({
    threadId: 't',
    chatId: 'c',
    message: 'What is this?',
    context,
  });

  it.each([
    [{ page: 'member' as const, memberUid: 'm-2' }, 'Reading this member page'],
    [{ page: 'team' as const, teamUid: 't-1' }, 'Reading this team page'],
    [{ page: 'job' as const, jobUid: 'j-1' }, 'Reading the job post'],
    [{ page: 'job' as const }, 'Reading the job post'],
    [{ page: 'profile' as const }, 'Reading your profile'],
  ])('answers about the page %o', (context, step) => {
    const body = mockChatBody(req(context));
    expect(body.steps).toContain(step);
    expect(body.content).toMatch(/^This is a mock answer\. The live agent will read /);
  });

  it.each([
    [{ page: 'member' as const, memberUid: 'missing-1' }, 'MEMBER_NOT_FOUND'],
    [{ page: 'team' as const, teamUid: 'missing-1' }, 'TEAM_NOT_FOUND'],
    [{ page: 'job' as const, jobUid: 'missing-1' }, 'JOB_NOT_FOUND'],
  ])('gives a 404 for a missing page %o', async (context, code) => {
    const done = mockLabosAgentClient.chat(req(context));
    const check = expect(done).rejects.toMatchObject({ status: 404, code });
    await jest.runAllTimersAsync();
    await check;
  });
});
