import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import type { LabosAgentClient, LabosAgentDraft } from '@/types/labos-agent.types';
import { LabosAgentError } from '@/services/labos-agent/labos-agent.errors';

/**
 * LAB-3300 (S3 frontend): the intro draft card in the agent panel. Contract section 8 of
 * `contracts/lab-3272-labos-agent-api.md`. Only `customFetch` is mocked, so the tests check the fetch bodies. LAB-3457:
 * a saved turn (C1 `persist: true`) sends its draft with C5 (`/v1/labos-agent/drafts/confirm`); a turn that was not
 * saved keeps the real `createIntroRequest` (C3).
 */
const chat = jest.fn();
const client: LabosAgentClient = {
  chat,
  confirmAction: jest.fn(),
  getAccess: async () => ({ enabled: true }),
  searchMentions: jest.fn(),
};

jest.mock('@/services/labos-agent/labos-agent.service', () => ({
  ...jest.requireActual('@/services/labos-agent/labos-agent.service'),
  getLabosAgentClient: () => client,
}));

const customFetch = jest.fn();
jest.mock('@/utils/fetch-wrapper', () => ({ customFetch: (...args: unknown[]) => customFetch(...args) }));

const onDialogOpened = jest.fn();
const onDialogClosed = jest.fn();
const onAskSubmitted = jest.fn();
const onSubmitFailed = jest.fn();
jest.mock('@/analytics/intro-requests.analytics', () => ({
  useIntroRequestAnalytics: () => ({
    onButtonShown: jest.fn(),
    onDialogOpened,
    onDialogClosed,
    onAskSubmitted,
    onSubmitFailed,
  }),
}));

// jest.setup.js replaces useQuery with a stub; the access check needs the real one.
jest.mock('@tanstack/react-query', () => jest.requireActual('@tanstack/react-query'));

// LAB-3318: the composer placeholder reads the intro role. Its real queries call the network and sign the test out.
jest.mock('@/services/intro-requests/hooks/useCanRequestIntro', () => ({ useCanRequestIntro: () => false }));

jest.mock('@/components/common/Markdown', () => ({
  Markdown: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
}));

import { LabosAgentRoot } from '@/components/core/labos-agent/LabosAgentRoot/LabosAgentRoot';
import { useCurrentUserStore } from '@/services/auth/store';
import {
  introRequestTargetKey,
  markIntroRequestSent,
  retainIntroRequestTarget,
} from '@/services/intro-requests/intro-request-entry-registry';
import { chatKey, useLabosAgentStore } from '@/services/labos-agent/store';
import type { IUserInfo } from '@/types/shared.types';

const context = {
  page: 'intro' as const,
  introTarget: { type: 'member' as const, uid: 'm-1' },
  label: 'Intro to Ada Lovelace',
  entryPoint: 'member-header' as const,
};

const DRAFT_TEXT = 'I lead fundraising at Acme. We raise a seed round and want advice.';

const draft = (over: Partial<LabosAgentDraft> = {}): LabosAgentDraft => ({
  draftId: 'dr_1',
  kind: 'intro',
  target: { type: 'member', uid: 'm-1', name: 'Ada Lovelace' },
  text: DRAFT_TEXT,
  minLength: 20,
  maxLength: 3500,
  source: 'agent',
  ...over,
});

const answer = (drafts: LabosAgentDraft[] = [draft()]) => ({
  steps: ['Understanding the question'],
  content: drafts.length ? 'Here is a draft. Check it and press Send.' : 'You cannot request intros.',
  sources: [],
  sourceRefs: [],
  followUpQuestions: [],
  actions: [],
  proposals: [],
  drafts,
});

const ok = (body: unknown = { uid: 'ir-1' }) => ({ ok: true, status: 200, json: async () => body });
const fail = (status: number, body: unknown = {}) => ({ ok: false, status, json: async () => body });

// LAB-3297 V0-R2: the intro events with `source: 'agent'` carry the `conversationId` of the dock session.
const eventContext = {
  targetType: 'member',
  entryPoint: 'member-header',
  source: 'agent',
  conversationId: expect.stringMatching(/^[0-9a-f-]{36}$/),
};

async function openWithDraft(drafts?: LabosAgentDraft[]) {
  chat.mockResolvedValue(answer(drafts));
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={qc}>
      <LabosAgentRoot />
    </QueryClientProvider>,
  );
  act(() => useLabosAgentStore.getState().actions.openAgent({ context, prefill: 'Help me write an intro request.' }));
  const composer = await screen.findByLabelText('Message the agent');
  fireEvent.keyDown(composer, { key: 'Enter' });
  await screen.findByText(/Check it and press Send|You cannot request intros/);
}

const card = () => screen.getByRole('article', { name: 'Intro request to Ada Lovelace' });
const field = () => within(card()).getByLabelText('Your request. Edit it before you send.') as HTMLTextAreaElement;
const sendButton = () => within(card()).queryByRole('button', { name: /Send|Sending/ });

describe('LAB-3300: agent intro draft card', () => {
  beforeEach(() => {
    chat.mockReset();
    customFetch.mockReset();
    [onDialogOpened, onDialogClosed, onAskSubmitted, onSubmitFailed].forEach((f) => f.mockReset());
    window.localStorage.clear();
    window.localStorage.setItem('labos-agent', 'on');
    useLabosAgentStore.setState({ isOpen: false, context: null, chats: {}, prefill: null, sentIntroTargets: {} });
    useCurrentUserStore.setState({ currentUser: { uid: 'me' } as IUserInfo, isHydrated: true });
  });

  it('puts the first message in the composer and sends the intro context without the label', async () => {
    await openWithDraft();
    expect(chat.mock.calls[0][0]).toMatchObject({
      message: 'Help me write an intro request.',
      context: { page: 'intro', introTarget: { type: 'member', uid: 'm-1' } },
    });
    expect(chat.mock.calls[0][0].context).toEqual({ page: 'intro', introTarget: { type: 'member', uid: 'm-1' } });
    expect(screen.getByText('Intro to Ada Lovelace')).toBeInTheDocument();
  });

  it('S3-R11: shows the draft text in a field with the draft limits', async () => {
    await openWithDraft();
    expect(field()).toHaveValue(DRAFT_TEXT);
    expect(field()).toHaveAttribute('maxLength', '3500');
    expect(field()).toHaveAttribute('minLength', '20');
    expect(sendButton()).toBeEnabled();
    expect(within(card()).getAllByRole('status')).toHaveLength(1);
    expect(onDialogOpened).toHaveBeenCalledWith(eventContext);
  });

  it('S3-R11: Send is off below minLength and the field stops at maxLength', async () => {
    await openWithDraft([draft({ maxLength: 100 })]);
    fireEvent.change(field(), { target: { value: '   short text   ' } });
    expect(sendButton()).toBeDisabled();
    expect(within(card()).getByText('Add a bit more detail so we can find the right person.')).toBeInTheDocument();

    fireEvent.change(field(), { target: { value: 'x'.repeat(150) } });
    expect(field().value).toHaveLength(100);
    expect(sendButton()).toBeEnabled();
  });

  it('S3-R11: Send is off for 20 characters that are mostly spaces (the check trims)', async () => {
    await openWithDraft();
    const padded = `${' '.repeat(18)}hi`;
    expect(padded).toHaveLength(20);
    fireEvent.change(field(), { target: { value: padded } });
    expect(sendButton()).toBeDisabled();
    fireEvent.click(sendButton()!);
    expect(customFetch).not.toHaveBeenCalled();
  });

  it('hides the short-text hint on an empty field', async () => {
    await openWithDraft();
    fireEvent.change(field(), { target: { value: '' } });
    expect(sendButton()).toBeDisabled();
    expect(within(card()).queryByText(/Add a bit more detail/)).not.toBeInTheDocument();
    expect(field()).not.toHaveAttribute('aria-invalid');
  });

  it('marks the field invalid and links the error to it', async () => {
    customFetch.mockResolvedValue(fail(500));
    await openWithDraft();
    fireEvent.click(sendButton()!);
    const error = await within(card()).findByText('The request could not be sent. Try again.');
    expect(field()).toHaveAttribute('aria-invalid', 'true');
    expect(field().getAttribute('aria-describedby')).toContain(error.id);
  });

  it('keeps the text the member typed when "Ask the agent" opens the agent again', async () => {
    await openWithDraft();
    const composer = screen.getByLabelText('Message the agent') as HTMLTextAreaElement;
    fireEvent.change(composer, { target: { value: 'My own question' } });
    act(() => useLabosAgentStore.getState().actions.openAgent({ context, prefill: 'Help me write an intro request.' }));
    expect(composer).toHaveValue('My own question');
  });

  it('Oleg #4: after a send, a second draft for the same target shows "Intro already requested" and no Send', async () => {
    customFetch.mockResolvedValue(ok());
    await openWithDraft([draft(), draft({ draftId: 'dr_2', text: 'A second draft for the same member.' })]);
    const [first, second] = screen.getAllByRole('article', { name: 'Intro request to Ada Lovelace' });
    fireEvent.click(within(first).getByRole('button', { name: 'Send' }));

    expect(
      await within(first).findByText('Your request is received. Someone from the team will reach out.'),
    ).toBeInTheDocument();
    expect(within(second).getByText('Intro already requested')).toBeInTheDocument();
    expect(within(second).queryByRole('button', { name: /Send/ })).not.toBeInTheDocument();
    expect(customFetch).toHaveBeenCalledTimes(1);
  });

  it('Oleg #4: a draft for a target that the page shows as "Intro requested" has no Send', async () => {
    const release = retainIntroRequestTarget(introRequestTargetKey('MEMBER', 'm-1'));
    markIntroRequestSent(introRequestTargetKey('MEMBER', 'm-1'));
    try {
      await openWithDraft();
      expect(within(card()).getByText('Intro already requested')).toBeInTheDocument();
      expect(sendButton()).not.toBeInTheDocument();
      expect(customFetch).not.toHaveBeenCalled();
    } finally {
      release();
    }
  });

  it('LAB-3457: Send on a saved turn posts C5 { threadId, draftId, decision, text } with the edited, trimmed text', async () => {
    customFetch.mockResolvedValue(ok({ draftId: 'dr_1', status: 'sent', introRequestUid: 'ir-1' }));
    await openWithDraft([draft({ target: { type: 'team', uid: 't-9', name: 'Ada Lovelace' } })]);
    expect(chat.mock.calls[0][0]).toMatchObject({ persist: true });
    const threadId = chat.mock.calls[0][0].threadId;
    fireEvent.change(field(), { target: { value: '  My own words for the intro request.  ' } });
    fireEvent.click(sendButton()!);

    await waitFor(() => expect(customFetch).toHaveBeenCalledTimes(1));
    const [url, init] = customFetch.mock.calls[0];
    expect(url).toMatch(/\/v1\/labos-agent\/drafts\/confirm$/);
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body)).toEqual({
      threadId,
      draftId: 'dr_1',
      decision: 'send',
      text: 'My own words for the intro request.',
    });
    expect(
      await within(card()).findByText('Your request is received. Someone from the team will reach out.'),
    ).toBeInTheDocument();
  });

  it('S3-R12: Send on a turn that was not saved posts C3 exactly { type, targetId, text }', async () => {
    customFetch.mockResolvedValue(ok());
    act(() =>
      useLabosAgentStore.getState().actions.updateTurns(chatKey(context), () => [
        {
          id: 'turn-unsaved',
          message: 'Help me write an intro request.',
          status: 'done',
          ...answer([draft({ target: { type: 'team', uid: 't-9', name: 'Ada Lovelace' } })]),
          cards: {},
          draftCards: {},
          startedAt: 1,
          endedAt: 2,
        },
      ]),
    );
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={qc}>
        <LabosAgentRoot />
      </QueryClientProvider>,
    );
    act(() => useLabosAgentStore.getState().actions.openAgent({ context }));
    await screen.findByText('Here is a draft. Check it and press Send.');
    fireEvent.change(field(), { target: { value: '  My own words for the intro request.  ' } });
    fireEvent.click(sendButton()!);

    await waitFor(() => expect(customFetch).toHaveBeenCalledTimes(1));
    const [url, init] = customFetch.mock.calls[0];
    expect(url).toMatch(/\/v1\/intro-requests$/);
    expect(JSON.parse(init.body)).toEqual({
      type: 'TEAM',
      targetId: 't-9',
      text: 'My own words for the intro request.',
    });
  });

  it('LAB-3457: a C5 409 DRAFT_CLOSED with status sent shows the card sent, with no Send', async () => {
    customFetch.mockResolvedValue(
      fail(409, { statusCode: 409, code: 'DRAFT_CLOSED', message: 'Closed', status: 'sent' }),
    );
    await openWithDraft();
    fireEvent.click(sendButton()!);

    expect(
      await within(card()).findByText('Your request is received. Someone from the team will reach out.'),
    ).toBeInTheDocument();
    expect(sendButton()).not.toBeInTheDocument();
    expect(onSubmitFailed).not.toHaveBeenCalled();
  });

  it.each(['DRAFT_NOT_FOUND', 'THREAD_NOT_FOUND'])(
    'LAB-3457: a C5 404 %s (the turn was not saved after all, or the thread is gone) sends once with C3, with no failure loop',
    async (code) => {
      customFetch
        .mockResolvedValueOnce(fail(404, { statusCode: 404, code, message: 'The draft was not found.' }))
        .mockResolvedValueOnce(ok());
      await openWithDraft([draft({ target: { type: 'team', uid: 't-9', name: 'Ada Lovelace' } })]);
      fireEvent.change(field(), { target: { value: '  My own words for the intro request.  ' } });
      fireEvent.click(sendButton()!);

      expect(
        await within(card()).findByText('Your request is received. Someone from the team will reach out.'),
      ).toBeInTheDocument();
      expect(customFetch).toHaveBeenCalledTimes(2);
      expect(customFetch.mock.calls[0][0]).toMatch(/\/v1\/labos-agent\/drafts\/confirm$/);
      const [url, init] = customFetch.mock.calls[1];
      expect(url).toMatch(/\/v1\/intro-requests$/);
      expect(JSON.parse(init.body)).toEqual({
        type: 'TEAM',
        targetId: 't-9',
        text: 'My own words for the intro request.',
      });
      expect(sendButton()).not.toBeInTheDocument();
      expect(screen.queryByText('The draft was not found.')).not.toBeInTheDocument();
      expect(onSubmitFailed).not.toHaveBeenCalled();
    },
  );

  it('LAB-3457: a C5 409 DRAFT_CLOSED with status cancelled shows the card cancelled, never sent', async () => {
    customFetch.mockResolvedValue(
      fail(409, { statusCode: 409, code: 'DRAFT_CLOSED', message: 'Closed', status: 'cancelled' }),
    );
    await openWithDraft();
    fireEvent.click(sendButton()!);

    expect(await within(card()).findByText('Cancelled. Nothing was sent.')).toBeInTheDocument();
    expect(
      within(card()).queryByText('Your request is received. Someone from the team will reach out.'),
    ).not.toBeInTheDocument();
    expect(sendButton()).not.toBeInTheDocument();
    expect(customFetch).toHaveBeenCalledTimes(1);
    expect(onSubmitFailed).not.toHaveBeenCalled();
  });

  it('LAB-3457: after a DRAFT_NOT_FOUND, a C3 failure shows the C3 message and keeps Send', async () => {
    customFetch
      .mockResolvedValueOnce(
        fail(404, { statusCode: 404, code: 'DRAFT_NOT_FOUND', message: 'The draft was not found.' }),
      )
      .mockResolvedValueOnce(fail(404, { message: 'That member is not on the directory any more.' }));
    await openWithDraft();
    fireEvent.click(sendButton()!);

    expect(await within(card()).findByText('That member is not on the directory any more.')).toBeInTheDocument();
    expect(screen.queryByText('The draft was not found.')).not.toBeInTheDocument();
    expect(onSubmitFailed).toHaveBeenCalledTimes(1);
  });

  it('LAB-3457: a C3 409 DRAFT_CLOSED sent (the same text went from a saved card) shows the card sent', async () => {
    customFetch.mockResolvedValue(
      fail(409, { statusCode: 409, code: 'DRAFT_CLOSED', message: 'This draft is closed.', status: 'sent' }),
    );
    act(() =>
      useLabosAgentStore.getState().actions.updateTurns(chatKey(context), () => [
        {
          id: 'turn-unsaved',
          message: 'Help me write an intro request.',
          status: 'done',
          ...answer(),
          cards: {},
          draftCards: {},
          startedAt: 1,
          endedAt: 2,
        },
      ]),
    );
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={qc}>
        <LabosAgentRoot />
      </QueryClientProvider>,
    );
    act(() => useLabosAgentStore.getState().actions.openAgent({ context }));
    await screen.findByText('Here is a draft. Check it and press Send.');
    fireEvent.click(sendButton()!);

    expect(
      await within(card()).findByText('Your request is received. Someone from the team will reach out.'),
    ).toBeInTheDocument();
    expect(customFetch.mock.calls[0][0]).toMatch(/\/v1\/intro-requests$/);
    expect(sendButton()).not.toBeInTheDocument();
    expect(screen.queryByText('This draft is closed.')).not.toBeInTheDocument();
    expect(onSubmitFailed).not.toHaveBeenCalled();
  });

  it('LAB-3457: a C5 403 with no message shows the intro request text and hides Send', async () => {
    customFetch.mockResolvedValue(fail(403, {}));
    await openWithDraft();
    fireEvent.click(sendButton()!);

    expect(await within(card()).findByText('You cannot send an intro request.')).toBeInTheDocument();
    expect(sendButton()).not.toBeInTheDocument();
  });

  it('S3-R12, S3-R13: after a 200 the card shows the received text, Send is gone and focus moves to the result', async () => {
    customFetch.mockResolvedValue(ok());
    await openWithDraft();
    fireEvent.click(sendButton()!);

    const status = await within(card()).findByText('Your request is received. Someone from the team will reach out.');
    expect(status).toHaveAttribute('role', 'status');
    expect(status).toHaveFocus();
    expect(sendButton()).not.toBeInTheDocument();
    expect(within(card()).queryByRole('textbox')).not.toBeInTheDocument();
    expect(onAskSubmitted).toHaveBeenCalledWith({ ...eventContext, textLength: DRAFT_TEXT.length });
  });

  it('S3-R13: two fast clicks give one request, and Send is off while it runs', async () => {
    let resolve: (v: unknown) => void = () => {};
    customFetch.mockReturnValue(new Promise((r) => (resolve = r)));
    await openWithDraft();
    const button = sendButton()!;
    fireEvent.click(button);
    fireEvent.click(button);

    await waitFor(() => expect(sendButton()).toHaveTextContent('Sending'));
    expect(sendButton()).toBeDisabled();
    fireEvent.click(sendButton()!);
    expect(customFetch).toHaveBeenCalledTimes(1);

    await act(async () => resolve(ok()));
    expect(customFetch).toHaveBeenCalledTimes(1);
  });

  it('S3-R14, LAB-3457: Cancel closes the card and sends no intro; a saved draft is cancelled with C5', async () => {
    customFetch.mockResolvedValue(fail(500));
    await openWithDraft();
    fireEvent.click(within(card()).getByRole('button', { name: 'Cancel' }));

    const status = within(card()).getByText('Cancelled. Nothing was sent.');
    expect(status).toHaveFocus();
    expect(within(card()).queryByRole('button')).not.toBeInTheDocument();
    expect(customFetch).toHaveBeenCalledTimes(1);
    const [url, init] = customFetch.mock.calls[0];
    expect(url).toMatch(/\/v1\/labos-agent\/drafts\/confirm$/);
    expect(JSON.parse(init.body)).toEqual({
      threadId: chat.mock.calls[0][0].threadId,
      draftId: 'dr_1',
      decision: 'cancel',
    });
    // A failed C5 cancel leaves the card closed.
    await waitFor(() => expect(within(card()).getByText('Cancelled. Nothing was sent.')).toBeInTheDocument());
    expect(onDialogClosed).toHaveBeenCalledWith({ ...eventContext, hadText: true, textLength: DRAFT_TEXT.length });
  });

  it.each([
    [401, {}, 'Your session ended. Sign in again, then ask the agent for a new draft.', true],
    [
      403,
      { message: 'Only members of portfolio teams and PL Infra can send an intro request' },
      'Only members of portfolio teams and PL Infra can send an intro request',
      false,
    ],
    [404, { message: 'Member not found' }, 'Member not found', true],
    [422, { message: 'Input validation failed: text: Too long' }, 'The request could not be sent. Try again.', true],
    [429, { message: 'ThrottlerException: Too Many Requests' }, 'Try again in a moment.', true],
    [500, {}, 'The request could not be sent. Try again.', true],
  ])('S3-R15: a %s shows its message and keeps the edited text', async (status, body, message, sendStays) => {
    customFetch.mockResolvedValue(fail(status, body));
    await openWithDraft();
    fireEvent.change(field(), { target: { value: 'My edited text for the intro request.' } });
    fireEvent.click(sendButton()!);

    expect(await within(card()).findByText(message)).toHaveAttribute('role', 'status');
    expect(field()).toHaveValue('My edited text for the intro request.');
    if (sendStays) expect(sendButton()).toBeEnabled();
    else expect(sendButton()).not.toBeInTheDocument();
    expect(onSubmitFailed).toHaveBeenCalledWith({
      ...eventContext,
      status,
      textLength: 'My edited text for the intro request.'.length,
    });
    expect(onAskSubmitted).not.toHaveBeenCalled();
  });

  const RBAC_DOWN = 'Intro requests are not available right now. Please try again.';

  it('LAB-3457: a C5 503 (permission check down, nothing sent) shows the API message, keeps Send, and does not retry', async () => {
    customFetch
      .mockResolvedValueOnce(fail(503, { statusCode: 503, message: RBAC_DOWN }))
      .mockResolvedValueOnce(ok({ draftId: 'dr_1', status: 'sent', introRequestUid: 'ir-1' }));
    await openWithDraft();
    fireEvent.click(sendButton()!);

    expect(await within(card()).findByText(RBAC_DOWN)).toBeInTheDocument();
    expect(customFetch).toHaveBeenCalledTimes(1);
    expect(field()).toHaveValue(DRAFT_TEXT);
    expect(onSubmitFailed).toHaveBeenCalledWith(expect.objectContaining({ status: 503 }));

    fireEvent.click(sendButton()!);
    expect(
      await within(card()).findByText('Your request is received. Someone from the team will reach out.'),
    ).toBeInTheDocument();
    expect(customFetch).toHaveBeenCalledTimes(2);
  });

  it('LAB-3457: a C3 503 on a turn that was not saved shows the API message; a 503 with no message, the plain one', async () => {
    customFetch
      .mockResolvedValueOnce(fail(503, { statusCode: 503, message: RBAC_DOWN }))
      .mockResolvedValueOnce(fail(503, {}));
    act(() =>
      useLabosAgentStore.getState().actions.updateTurns(chatKey(context), () => [
        {
          id: 'turn-unsaved',
          message: 'Help me write an intro request.',
          status: 'done',
          ...answer(),
          cards: {},
          draftCards: {},
          startedAt: 1,
          endedAt: 2,
        },
      ]),
    );
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={qc}>
        <LabosAgentRoot />
      </QueryClientProvider>,
    );
    act(() => useLabosAgentStore.getState().actions.openAgent({ context }));
    await screen.findByText('Here is a draft. Check it and press Send.');
    fireEvent.click(sendButton()!);

    expect(await within(card()).findByText(RBAC_DOWN)).toBeInTheDocument();
    expect(customFetch.mock.calls[0][0]).toMatch(/\/v1\/intro-requests$/);
    expect(customFetch).toHaveBeenCalledTimes(1);

    fireEvent.click(sendButton()!);
    expect(await within(card()).findByText('The request could not be sent. Try again.')).toBeInTheDocument();
    expect(customFetch).toHaveBeenCalledTimes(2);
  });

  it('S3-R15: no response keeps the text and Send, and a second Send works', async () => {
    customFetch.mockRejectedValueOnce(new TypeError('Failed to fetch')).mockResolvedValueOnce(ok());
    await openWithDraft();
    fireEvent.click(sendButton()!);

    expect(await within(card()).findByText('The request could not be sent. Try again.')).toBeInTheDocument();
    expect(field()).toHaveValue(DRAFT_TEXT);
    expect(onSubmitFailed).toHaveBeenCalledWith(expect.objectContaining({ status: 0, source: 'agent' }));

    fireEvent.click(sendButton()!);
    expect(
      await within(card()).findByText('Your request is received. Someone from the team will reach out.'),
    ).toBeInTheDocument();
    expect(customFetch).toHaveBeenCalledTimes(2);
  });

  it('shows the answer and no card when the agent refuses (drafts: [])', async () => {
    await openWithDraft([]);
    expect(screen.getByText('You cannot request intros.')).toBeInTheDocument();
    expect(screen.queryByRole('article')).not.toBeInTheDocument();
  });

  it('shows a plain message for a C1 404 INTRO_TARGET_NOT_FOUND', async () => {
    chat.mockRejectedValue(new LabosAgentError(404, 'INTRO_TARGET_NOT_FOUND', 'Not found'));
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={qc}>
        <LabosAgentRoot />
      </QueryClientProvider>,
    );
    act(() => useLabosAgentStore.getState().actions.openAgent({ context, prefill: 'Help me.' }));
    fireEvent.keyDown(await screen.findByLabelText('Message the agent'), { key: 'Enter' });

    expect(await screen.findByRole('alert')).toHaveTextContent('The agent cannot find this member or team.');
    expect(screen.queryByRole('article')).not.toBeInTheDocument();
  });
});
