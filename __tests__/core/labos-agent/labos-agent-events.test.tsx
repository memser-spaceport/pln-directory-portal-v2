import { act, fireEvent, render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import type {
  LabosAgentChatResponse,
  LabosAgentClient,
  LabosAgentDraft,
  LabosAgentEntryPoint,
  LabosAgentOpenContext,
  LabosAgentProposal,
} from '@/types/labos-agent.types';
import { LabosAgentError } from '@/services/labos-agent/labos-agent.errors';

/**
 * LAB-3297 (S0 frontend): the 10 `agent-*` events of v0 and the intro events with `source: 'agent'`. The tests run the
 * real panel, store and analytics hooks; only PostHog, C1, C2 and `customFetch` (C3) are mocked. Each test name
 * starts with the event name and its requirement ID from Dana's spec (V0-R1 to V0-R5).
 */
const capture = jest.fn();
jest.mock('posthog-js/react', () => ({
  usePostHog: () => ({ capture: (...args: unknown[]) => capture(...args) }),
}));

const chat = jest.fn();
const confirmAction = jest.fn();
const client: LabosAgentClient = {
  chat,
  confirmAction,
  getAccess: async () => ({ enabled: true }),
  searchMentions: jest.fn(),
};
jest.mock('@/services/labos-agent/labos-agent.service', () => ({
  ...jest.requireActual('@/services/labos-agent/labos-agent.service'),
  getLabosAgentClient: () => client,
}));

const customFetch = jest.fn();
jest.mock('@/utils/fetch-wrapper', () => ({ customFetch: (...args: unknown[]) => customFetch(...args) }));

// jest.setup.js replaces useQuery with a stub; the access check needs the real one.
jest.mock('@tanstack/react-query', () => jest.requireActual('@tanstack/react-query'));
jest.mock('@/services/intro-requests/hooks/useCanRequestIntro', () => ({ useCanRequestIntro: () => false }));
jest.mock('@/components/common/Markdown', () => ({
  Markdown: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
}));

import { LabosAgentRoot } from '@/components/core/labos-agent/LabosAgentRoot/LabosAgentRoot';
import { useCurrentUserStore } from '@/services/auth/store';
import { resetDockEventsForTest } from '@/services/labos-agent/hooks/useLabosAgentDockEvents';
import { useLabosAgentStore } from '@/services/labos-agent/store';
import type { IUserInfo } from '@/types/shared.types';

/* Values that must never reach an event (V0-R5). */
const STORY_UID = 'news-secret-uid';
const STORY_TITLE = 'Acme raises a seed round';
const MESSAGE = 'What did Acme announce this week?';
const ANSWER = 'Acme announced a seed round of 3 million.';
const MEMBER_NAME = 'Ada Lovelace';
const MEMBER_UID = 'member-secret-uid';
const DRAFT_TEXT = 'I lead fundraising at Acme. We raise a seed round and want advice.';
const SECRETS = [STORY_UID, STORY_TITLE, MESSAGE, ANSWER, MEMBER_NAME, MEMBER_UID, DRAFT_TEXT, 'Old bio', 'New bio'];

const newsContext: LabosAgentOpenContext = { page: 'news-story', newsUid: STORY_UID, label: STORY_TITLE };
const introContext: LabosAgentOpenContext = {
  page: 'intro',
  introTarget: { type: 'member', uid: MEMBER_UID },
  label: `Intro to ${MEMBER_NAME}`,
  entryPoint: 'member-header',
};

const bio: LabosAgentProposal = {
  proposalId: 'ap_bio',
  tool: 'update_my_profile',
  title: 'Update your bio',
  targetType: 'member',
  changes: [{ field: 'bio', label: 'Bio', oldValue: 'Old bio', newValue: 'New bio' }],
};

const draft: LabosAgentDraft = {
  draftId: 'dr_1',
  kind: 'intro',
  target: { type: 'member', uid: MEMBER_UID, name: MEMBER_NAME },
  text: DRAFT_TEXT,
  minLength: 20,
  maxLength: 3500,
  source: 'agent',
};

const answer = (over: Partial<LabosAgentChatResponse> = {}): LabosAgentChatResponse => ({
  steps: [],
  content: ANSWER,
  sources: ['https://example.com/acme'],
  sourceRefs: [{ type: 'news', uid: STORY_UID, title: STORY_TITLE }],
  followUpQuestions: [],
  actions: [],
  proposals: [],
  drafts: [],
  ...over,
});

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

const events = (name: string) => capture.mock.calls.filter(([event]) => event === name).map(([, props]) => props);
const one = (name: string) => {
  const found = events(name);
  expect(found).toHaveLength(1);
  return found[0] as Record<string, unknown>;
};

function renderApp() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={qc}>
      <LabosAgentRoot />
    </QueryClientProvider>,
  );
}

async function open(context: LabosAgentOpenContext | null, entryPoint: LabosAgentEntryPoint) {
  act(() => useLabosAgentStore.getState().actions.openAgent({ context, entryPoint }));
  return screen.findByLabelText('Message the agent');
}

async function send(text: string, waitFor: string | RegExp = ANSWER) {
  const composer = screen.getByLabelText('Message the agent');
  fireEvent.change(composer, { target: { value: text } });
  fireEvent.keyDown(composer, { key: 'Enter' });
  if (waitFor) await screen.findAllByText(waitFor);
}

const close = () => act(() => useLabosAgentStore.getState().actions.closeAgent());

describe('LAB-3297: agent events', () => {
  beforeEach(() => {
    capture.mockReset();
    chat.mockReset();
    confirmAction.mockReset();
    customFetch.mockReset();
    resetDockEventsForTest();
    window.localStorage.clear();
    window.localStorage.setItem('labos-agent', 'on');
    useLabosAgentStore.setState({
      isOpen: false,
      context: null,
      chats: {},
      prefill: null,
      sentIntroTargets: {},
      session: null,
    });
    useCurrentUserStore.setState({ currentUser: { uid: 'me' } as IUserInfo, isHydrated: true });
    chat.mockResolvedValue(answer());
  });

  afterEach(() => {
    // V0-R5: no event of any test holds text, names or IDs of members, teams or news.
    const all = JSON.stringify(capture.mock.calls);
    SECRETS.forEach((secret) => expect(all).not.toContain(secret));
  });

  it('agent-dock-opened (V0-R1): one event with the shared properties and contextAttached', async () => {
    renderApp();
    await open(newsContext, 'news-story');

    const props = one('agent-dock-opened');
    expect(props).toEqual({
      flow: 'news',
      entryPoint: 'news-story',
      pageType: 'news',
      conversationId: expect.stringMatching(UUID),
      contextAttached: true,
      loggedInUserUid: 'me',
    });
  });

  it('agent-dock-opened (V0-R1): the corner on Home has flow other and no context', async () => {
    renderApp();
    await open(null, 'corner');
    expect(one('agent-dock-opened')).toMatchObject({
      flow: 'other',
      entryPoint: 'corner',
      pageType: 'other',
      contextAttached: false,
    });
  });

  it('agent-dock-opened (V0-R1): a second open press in the open panel sends no second event', async () => {
    renderApp();
    await open(newsContext, 'news-story');
    await open(newsContext, 'news-story');
    expect(events('agent-dock-opened')).toHaveLength(1);
  });

  it('agent-message-sent (V0-R1): 2 messages have turnIndex 1 and 2 and the same conversationId', async () => {
    renderApp();
    await open(newsContext, 'news-story');
    await send(MESSAGE);
    await send(MESSAGE);

    const sent = events('agent-message-sent');
    expect(sent).toHaveLength(2);
    expect(sent[0]).toMatchObject({
      flow: 'news',
      entryPoint: 'news-story',
      messageLength: MESSAGE.length,
      turnIndex: 1,
      isRetry: false,
      contextAttached: true,
      mentionCount: 0,
    });
    expect(sent[1]).toMatchObject({ turnIndex: 2 });
    const { conversationId } = one('agent-dock-opened');
    expect(sent.map((p) => p.conversationId)).toEqual([conversationId, conversationId]);
  });

  it('agent-message-sent (V0-R1): contextAttached is false after the member removes the page chip', async () => {
    renderApp();
    await open(newsContext, 'news-story');
    fireEvent.click(screen.getByRole('button', { name: `Stop reading ${STORY_TITLE}` }));
    await send(MESSAGE);
    expect(one('agent-message-sent')).toMatchObject({ contextAttached: false });
  });

  it('agent-answer-shown (V0-R1, V0-R4): the client counts the sources and omits the C1-only counts', async () => {
    renderApp();
    await open(newsContext, 'news-story');
    await send(MESSAGE);

    const props = one('agent-answer-shown');
    expect(props).toMatchObject({ turnIndex: 1, answerLength: ANSWER.length, sourceCount: 2 });
    expect(props.latencyMs).toEqual(expect.any(Number));
    expect(props).not.toHaveProperty('usedWebSearch');
    expect(props).not.toHaveProperty('toolCount');
  });

  it('agent-answer-shown (V0-R4): the C1 final chunk counts win when they come', async () => {
    chat.mockResolvedValue(answer({ toolCount: 3, usedWebSearch: true, sourceCount: 5 }));
    renderApp();
    await open(newsContext, 'news-story');
    await send(MESSAGE);
    expect(one('agent-answer-shown')).toMatchObject({ toolCount: 3, usedWebSearch: true, sourceCount: 5 });
  });

  it('agent-answer-failed (V0-R1): a 500 sends http-5xx, then Retry sends isRetry=true', async () => {
    chat.mockRejectedValueOnce(new LabosAgentError(500, 'UNKNOWN', 'Server error'));
    renderApp();
    await open(newsContext, 'news-story');
    await send(MESSAGE, 'The agent did not finish the answer.');

    expect(one('agent-answer-failed')).toMatchObject({ turnIndex: 1, errorType: 'http-5xx', status: 500 });
    fireEvent.click(screen.getByText('Retry'));
    await screen.findByText(ANSWER);
    expect(events('agent-message-sent')[1]).toMatchObject({ isRetry: true, turnIndex: 1 });
  });

  it('agent-answer-failed (V0-R1): no HTTP response sends network with status 0', async () => {
    chat.mockRejectedValueOnce(new TypeError('Failed to fetch'));
    renderApp();
    await open(newsContext, 'news-story');
    await send(MESSAGE, 'The agent did not finish the answer.');
    expect(one('agent-answer-failed')).toMatchObject({ errorType: 'network', status: 0 });
  });

  it('agent-answer-failed (V0-R1): a stalled answer sends timeout and no agent-answer-shown', async () => {
    chat.mockResolvedValue(
      answer({ content: 'Part. The answer was cut short because the AI provider stopped responding.' }),
    );
    renderApp();
    await open(newsContext, 'news-story');
    await send(MESSAGE, /cut short/);
    expect(one('agent-answer-failed')).toMatchObject({ errorType: 'timeout', status: 200 });
    expect(events('agent-answer-shown')).toHaveLength(0);
  });

  it('agent-source-clicked (V0-R1): the first source has position 1, the web source position 2', async () => {
    renderApp();
    await open(newsContext, 'news-story');
    await send(MESSAGE);

    fireEvent.click(screen.getByText(STORY_TITLE, { selector: '.refTitle' }));
    fireEvent.click(screen.getByText('example.com'));
    const clicks = events('agent-source-clicked');
    expect(clicks).toHaveLength(2);
    expect(clicks[0]).toMatchObject({ sourceType: 'labos', position: 1 });
    expect(clicks[1]).toMatchObject({ sourceType: 'web', position: 2 });
  });

  it('agent-action-proposed (V0-R1): one event for each action card', async () => {
    chat.mockResolvedValue(answer({ proposals: [bio] }));
    renderApp();
    await open(null, 'corner');
    await send(MESSAGE);
    expect(one('agent-action-proposed')).toMatchObject({
      actionType: 'profile-field',
      fieldCount: 1,
      draftLength: 0,
    });
  });

  it('agent-action-confirmed (V0-R1): Confirm with a 2xx sends one event', async () => {
    chat.mockResolvedValue(answer({ proposals: [bio] }));
    confirmAction.mockResolvedValue({ proposalId: 'ap_bio', status: 'done', summary: 'Your bio is updated.' });
    renderApp();
    await open(null, 'corner');
    await send(MESSAGE);
    fireEvent.click(screen.getByText('Confirm'));
    await screen.findByText('Your bio is updated.');

    expect(one('agent-action-confirmed')).toMatchObject({
      actionType: 'profile-field',
      fieldCount: 1,
      edited: false,
      draftLength: 0,
    });
  });

  it('agent-action-cancelled (V0-R1): Cancel sends one event and no confirm event', async () => {
    chat.mockResolvedValue(answer({ proposals: [bio] }));
    confirmAction.mockResolvedValue({ proposalId: 'ap_bio', status: 'cancelled', summary: '' });
    renderApp();
    await open(null, 'corner');
    await send(MESSAGE);
    fireEvent.click(screen.getByText('Cancel'));
    await screen.findByText('Cancelled. Nothing was saved.');

    expect(one('agent-action-cancelled')).toMatchObject({ actionType: 'profile-field', edited: false });
    expect(events('agent-action-confirmed')).toHaveLength(0);
  });

  it('agent-action-cancelled (V0-R1): a close with an open card sends one event, once', async () => {
    chat.mockResolvedValue(answer({ proposals: [bio] }));
    renderApp();
    await open(null, 'corner');
    await send(MESSAGE);
    close();
    await open(null, 'corner');
    close();

    expect(one('agent-action-cancelled')).toMatchObject({ actionType: 'profile-field', edited: false });
  });

  it('agent-action-failed (V0-R1): a 403 on Confirm sends status 403', async () => {
    chat.mockResolvedValue(answer({ proposals: [bio] }));
    confirmAction.mockRejectedValue(new LabosAgentError(403, 'ACTION_NOT_ALLOWED', 'Forbidden'));
    renderApp();
    await open(null, 'corner');
    await send(MESSAGE);
    fireEvent.click(screen.getByText('Confirm'));
    await screen.findByText('You cannot make this change. Nothing was saved.');

    expect(one('agent-action-failed')).toMatchObject({ actionType: 'profile-field', status: 403 });
    expect(events('agent-action-confirmed')).toHaveLength(0);
  });

  it('agent-dock-closed (V0-R1): open and close with no message sends turnCount=0', async () => {
    renderApp();
    await open(newsContext, 'news-story');
    close();

    const props = one('agent-dock-closed');
    expect(props).toMatchObject({ turnCount: 0, actionCount: 0, confirmedCount: 0, entryPoint: 'news-story' });
    expect(props.openMs).toEqual(expect.any(Number));
    expect(props.conversationId).toBe(one('agent-dock-opened').conversationId);
  });

  it('agent-dock-closed (V0-R1): counts the turns, cards and confirms of the session', async () => {
    chat.mockResolvedValue(answer({ proposals: [bio] }));
    confirmAction.mockResolvedValue({ proposalId: 'ap_bio', status: 'done', summary: 'Your bio is updated.' });
    renderApp();
    await open(null, 'corner');
    await send(MESSAGE);
    fireEvent.click(screen.getByText('Confirm'));
    await screen.findByText('Your bio is updated.');
    close();
    expect(one('agent-dock-closed')).toMatchObject({ turnCount: 1, actionCount: 1, confirmedCount: 1 });
  });

  it('agent-dock-closed (V0-R1): a new context in the open panel closes the old session and opens a new one', async () => {
    renderApp();
    await open(newsContext, 'news-story');
    await open(null, 'shortcut');

    const opened = events('agent-dock-opened');
    expect(opened).toHaveLength(2);
    expect(opened[1]).toMatchObject({ entryPoint: 'shortcut' });
    expect(opened[1].conversationId).not.toBe(opened[0].conversationId);
    expect(one('agent-dock-closed').conversationId).toBe(opened[0].conversationId);
  });

  describe('intro draft (S3)', () => {
    const introAnswer = answer({ content: 'Here is a draft.', sources: [], sourceRefs: [], drafts: [draft] });
    const card = () => screen.getByRole('article', { name: `Intro request to ${MEMBER_NAME}` });
    const field = () => within(card()).getByLabelText('Your request. Edit it before you send.');

    beforeEach(() => chat.mockResolvedValue(introAnswer));

    it('agent-action-proposed (V0-R1): a draft card sends intro-draft with its length', async () => {
      renderApp();
      await open(introContext, 'intro-entry');
      await send('Help me write an intro request.', 'Here is a draft.');

      expect(one('agent-dock-opened')).toMatchObject({ flow: 'intro', entryPoint: 'intro-entry', pageType: 'member' });
      expect(one('agent-action-proposed')).toMatchObject({
        actionType: 'intro-draft',
        fieldCount: 1,
        draftLength: DRAFT_TEXT.length,
      });
    });

    it('agent-action-confirmed (V0-R1): Send with a 200 sends intro-draft with edited=true after an edit', async () => {
      customFetch.mockResolvedValue({ ok: true, status: 200, json: async () => ({ uid: 'ir-1' }) });
      renderApp();
      await open(introContext, 'intro-entry');
      await send('Help me write an intro request.', 'Here is a draft.');
      const edited = `${DRAFT_TEXT} Thanks`;
      fireEvent.change(field(), { target: { value: edited } });
      await act(async () => fireEvent.click(within(card()).getByRole('button', { name: 'Send' })));

      expect(one('agent-action-confirmed')).toMatchObject({
        actionType: 'intro-draft',
        fieldCount: 1,
        edited: true,
        draftLength: edited.length,
      });
    });

    it('agent-action-failed (V0-R1): a failed Send sends the C3 status', async () => {
      customFetch.mockResolvedValue({ ok: false, status: 500, json: async () => ({}) });
      renderApp();
      await open(introContext, 'intro-entry');
      await send('Help me write an intro request.', 'Here is a draft.');
      await act(async () => fireEvent.click(within(card()).getByRole('button', { name: 'Send' })));

      expect(one('agent-action-failed')).toMatchObject({ actionType: 'intro-draft', status: 500 });
    });

    it('agent-action-cancelled (V0-R1): Cancel on a draft card sends edited=false', async () => {
      renderApp();
      await open(introContext, 'intro-entry');
      await send('Help me write an intro request.', 'Here is a draft.');
      fireEvent.click(within(card()).getByRole('button', { name: 'Cancel' }));

      expect(one('agent-action-cancelled')).toMatchObject({ actionType: 'intro-draft', edited: false });
    });

    it('intro events (V0-R2): dialog-opened, dialog-closed and ask-submitted carry the dock conversationId', async () => {
      customFetch.mockResolvedValue({ ok: true, status: 200, json: async () => ({ uid: 'ir-1' }) });
      renderApp();
      await open(introContext, 'intro-entry');
      await send('Help me write an intro request.', 'Here is a draft.');
      await act(async () => fireEvent.click(within(card()).getByRole('button', { name: 'Send' })));

      const { conversationId } = one('agent-dock-opened');
      expect(one('intro-request-dialog-opened')).toMatchObject({ source: 'agent', conversationId });
      expect(one('ask-submitted')).toMatchObject({ source: 'agent', conversationId, type: 'intro' });
    });

    it('intro events (V0-R2): dialog-closed and submit-failed carry the dock conversationId', async () => {
      customFetch.mockResolvedValue({ ok: false, status: 500, json: async () => ({}) });
      renderApp();
      await open(introContext, 'intro-entry');
      await send('Help me write an intro request.', 'Here is a draft.');
      await act(async () => fireEvent.click(within(card()).getByRole('button', { name: 'Send' })));
      fireEvent.click(within(card()).getByRole('button', { name: 'Cancel' }));

      const { conversationId } = one('agent-dock-opened');
      expect(one('intro-request-submit-failed')).toMatchObject({ source: 'agent', conversationId, status: 500 });
      expect(one('intro-request-dialog-closed')).toMatchObject({ source: 'agent', conversationId });
    });
  });
});
