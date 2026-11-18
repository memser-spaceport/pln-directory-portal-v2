import { act, renderHook } from '@testing-library/react';

import type { LabosAgentDraft, LabosAgentTurn } from '@/types/labos-agent.types';

const createIntroRequest = jest.fn();
jest.mock('@/services/intro-requests/intro-requests.service', () => ({
  ...jest.requireActual('@/services/intro-requests/intro-requests.service'),
  createIntroRequest: (...args: unknown[]) => createIntroRequest(...args),
}));

jest.mock('@/analytics/intro-requests.analytics', () => ({
  useIntroRequestAnalytics: () => ({
    onButtonShown: jest.fn(),
    onDialogOpened: jest.fn(),
    onDialogClosed: jest.fn(),
    onAskSubmitted: jest.fn(),
    onSubmitFailed: jest.fn(),
  }),
}));

import { useLabosAgentChat } from '@/services/labos-agent/hooks/useLabosAgentChat';
import { IntroRequestError } from '@/services/intro-requests/intro-requests.service';
import { draftErrorState, toIntroRequestBody } from '@/services/labos-agent/labos-agent.drafts';
import { chatKey, useLabosAgentStore } from '@/services/labos-agent/store';

const draft: LabosAgentDraft = {
  draftId: 'dr_1',
  kind: 'intro',
  target: { type: 'member', uid: 'm-1', name: 'Ada' },
  text: 'I lead fundraising at Acme and want advice.',
  minLength: 20,
  maxLength: 3500,
  source: 'agent',
};

const context = { page: 'intro' as const, introTarget: { type: 'member' as const, uid: 'm-1' } };
const key = chatKey(context);

const turn = (draftCards: LabosAgentTurn['draftCards'] = {}): LabosAgentTurn => ({
  id: 't-1',
  message: 'Help me',
  status: 'done',
  steps: [],
  content: '',
  sources: [],
  sourceRefs: [],
  followUpQuestions: [],
  proposals: [],
  cards: {},
  drafts: [draft],
  draftCards,
  startedAt: 0,
});

const seed = (draftCards?: LabosAgentTurn['draftCards']) =>
  useLabosAgentStore.setState({ chats: { [key]: { threadId: 'th-1', turns: [turn(draftCards)] } } });

const cardOf = () => useLabosAgentStore.getState().chats[key].turns[0].draftCards.dr_1;

describe('LAB-3300: draft helpers', () => {
  it('S3-R12: maps the lower-case type and sends only type, targetId and text', () => {
    expect(toIntroRequestBody(draft, '  Hello there, my request.  ')).toEqual({
      type: 'MEMBER',
      targetId: 'm-1',
      text: 'Hello there, my request.',
    });
    expect(toIntroRequestBody({ ...draft, target: { type: 'team', uid: 't-1', name: 'T' } }, 'x').type).toBe('TEAM');
  });

  it('S3-R15: maps each C3 error and keeps the text', () => {
    const e = (status: number, message = 'API text') => new IntroRequestError(status, message);
    expect(draftErrorState(e(403), 'kept')).toEqual({ status: 'forbidden', text: 'kept', message: 'API text' });
    expect(draftErrorState(e(404, 'Team not found'), 'kept')).toMatchObject({
      status: 'error',
      message: 'Team not found',
    });
    expect(draftErrorState(e(422, 'Input validation failed: text'), 'kept').message).toBe(
      'The request could not be sent. Try again.',
    );
    expect(draftErrorState(e(429), 'kept').message).toBe('Try again in a moment.');
    expect(draftErrorState(e(401), 'kept').message).toBe(
      'Your session ended. Sign in again, then ask the agent for a new draft.',
    );
    expect(draftErrorState(new TypeError('network'), 'kept')).toEqual({
      status: 'error',
      text: 'kept',
      message: 'The request could not be sent. Try again.',
    });
  });
});

describe('LAB-3300: sendDraft guard', () => {
  beforeEach(() => {
    createIntroRequest.mockReset();
    useLabosAgentStore.setState({ isOpen: true, context, chats: {}, sentIntroTargets: {} });
  });

  it('S3-R13: sends one C3 request when sendDraft runs twice in the same tick', async () => {
    seed();
    let resolve: (v: unknown) => void = () => {};
    createIntroRequest.mockReturnValue(new Promise((r) => (resolve = r)));
    const { result } = renderHook(() => useLabosAgentChat(context));

    await act(async () => {
      void result.current.sendDraft('t-1', 'dr_1');
      void result.current.sendDraft('t-1', 'dr_1');
    });
    expect(createIntroRequest).toHaveBeenCalledTimes(1);
    expect(createIntroRequest).toHaveBeenCalledWith({ type: 'MEMBER', targetId: 'm-1', text: draft.text });

    await act(async () => resolve({ uid: 'ir-1' }));
    expect(cardOf().status).toBe('sent');

    await act(async () => result.current.sendDraft('t-1', 'dr_1'));
    expect(createIntroRequest).toHaveBeenCalledTimes(1);
  });

  it.each([['sent'], ['cancelled'], ['forbidden']] as const)('does nothing after %s', async (status) => {
    seed({ dr_1: { status, text: draft.text } });
    const { result } = renderHook(() => useLabosAgentChat(context));
    await act(async () => result.current.sendDraft('t-1', 'dr_1'));
    expect(createIntroRequest).not.toHaveBeenCalled();
  });

  it.each([['   too short   '], [`${' '.repeat(18)}hi`]])(
    'does not send %j (below minLength after trim)',
    async (text) => {
      seed({ dr_1: { status: 'open', text } });
      const { result } = renderHook(() => useLabosAgentChat(context));
      await act(async () => result.current.sendDraft('t-1', 'dr_1'));
      expect(createIntroRequest).not.toHaveBeenCalled();
    },
  );

  it('Oleg #4: sends once for each target, also from another draft or a New chat', async () => {
    const second: LabosAgentDraft = { ...draft, draftId: 'dr_2' };
    useLabosAgentStore.setState({
      chats: { [key]: { threadId: 'th-1', turns: [{ ...turn(), drafts: [draft, second] }] } },
    });
    createIntroRequest.mockResolvedValue({ uid: 'ir-1' });
    const { result } = renderHook(() => useLabosAgentChat(context));

    await act(async () => result.current.sendDraft('t-1', 'dr_1'));
    await act(async () => result.current.sendDraft('t-1', 'dr_2'));
    expect(createIntroRequest).toHaveBeenCalledTimes(1);

    act(() => result.current.newChat());
    useLabosAgentStore.setState((st) => ({
      chats: {
        [key]: { ...st.chats[key], turns: [{ ...turn(), id: 't-2', drafts: [{ ...draft, draftId: 'dr_3' }] }] },
      },
    }));
    await act(async () => result.current.sendDraft('t-2', 'dr_3'));
    expect(createIntroRequest).toHaveBeenCalledTimes(1);
  });

  it('frees the target after a failed send', async () => {
    seed();
    createIntroRequest.mockRejectedValueOnce(new IntroRequestError(500, 'x')).mockResolvedValueOnce({ uid: 'ir-1' });
    const { result } = renderHook(() => useLabosAgentChat(context));
    await act(async () => result.current.sendDraft('t-1', 'dr_1'));
    expect(useLabosAgentStore.getState().sentIntroTargets).toEqual({});
    await act(async () => result.current.sendDraft('t-1', 'dr_1'));
    expect(createIntroRequest).toHaveBeenCalledTimes(2);
  });

  it('S3-R14: cancelDraft closes the card and sends nothing', async () => {
    seed();
    const { result } = renderHook(() => useLabosAgentChat(context));
    act(() => result.current.cancelDraft('t-1', 'dr_1'));
    expect(cardOf()).toEqual({ status: 'cancelled', text: draft.text });
    expect(createIntroRequest).not.toHaveBeenCalled();
  });
});
