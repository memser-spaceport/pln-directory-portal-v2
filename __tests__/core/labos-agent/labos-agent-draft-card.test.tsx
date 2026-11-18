import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import type { LabosAgentClient, LabosAgentDraft } from '@/types/labos-agent.types';
import { LabosAgentError } from '@/services/labos-agent/labos-agent.errors';

/**
 * LAB-3300 (S3 frontend): the intro draft card in the agent panel. Contract section 8 of
 * `contracts/lab-3272-labos-agent-api.md`. Send goes through the real `createIntroRequest`; only `customFetch` is
 * mocked, so the tests check the C3 fetch body.
 */
const chat = jest.fn();
const client: LabosAgentClient = { chat, confirmAction: jest.fn(), getAccess: async () => ({ enabled: true }) };

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

jest.mock('@/components/common/Markdown', () => ({
  Markdown: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
}));

import { LabosAgentRoot } from '@/components/core/labos-agent/LabosAgentRoot/LabosAgentRoot';
import { useCurrentUserStore } from '@/services/auth/store';
import { useLabosAgentStore } from '@/services/labos-agent/store';
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

const eventContext = { targetType: 'member', entryPoint: 'member-header', source: 'agent' };

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
    useLabosAgentStore.setState({ isOpen: false, context: null, chats: {}, prefill: null });
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

  it('S3-R12: Send posts exactly { type, targetId, text } with the edited, trimmed text', async () => {
    customFetch.mockResolvedValue(ok());
    await openWithDraft([draft({ target: { type: 'team', uid: 't-9', name: 'Ada Lovelace' } })]);
    fireEvent.change(field(), { target: { value: '  My own words for the intro request.  ' } });
    fireEvent.click(sendButton()!);

    await waitFor(() => expect(customFetch).toHaveBeenCalledTimes(1));
    const [url, init] = customFetch.mock.calls[0];
    expect(url).toMatch(/\/v1\/intro-requests$/);
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body)).toEqual({
      type: 'TEAM',
      targetId: 't-9',
      text: 'My own words for the intro request.',
    });
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

  it('S3-R14: Cancel closes the card and sends no request', async () => {
    await openWithDraft();
    fireEvent.click(within(card()).getByRole('button', { name: 'Cancel' }));

    const status = within(card()).getByText('Cancelled. Nothing was sent.');
    expect(status).toHaveFocus();
    expect(within(card()).queryByRole('button')).not.toBeInTheDocument();
    expect(customFetch).not.toHaveBeenCalled();
    expect(onDialogClosed).toHaveBeenCalledWith({ ...eventContext, hadText: true, textLength: DRAFT_TEXT.length });
  });

  it.each([
    [401, {}, 'Sign in again, then press Send. Your text is kept.', true],
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
