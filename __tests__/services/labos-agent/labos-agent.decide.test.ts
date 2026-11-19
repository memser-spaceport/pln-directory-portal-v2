import { act, renderHook } from '@testing-library/react';

import type { LabosAgentClient, LabosAgentTurn } from '@/types/labos-agent.types';
import { LabosAgentError } from '@/services/labos-agent/labos-agent.errors';

const confirmAction = jest.fn();
const client: LabosAgentClient = {
  chat: jest.fn(),
  confirmAction,
  getAccess: async () => ({ enabled: true }),
  searchMentions: jest.fn(),
};

jest.mock('@/services/labos-agent/labos-agent.service', () => ({
  ...jest.requireActual('@/services/labos-agent/labos-agent.service'),
  getLabosAgentClient: () => client,
}));

import { useLabosAgentChat } from '@/services/labos-agent/hooks/useLabosAgentChat';
import { chatKey, useLabosAgentStore } from '@/services/labos-agent/store';

/**
 * LAB-3299, Oleg's review on PR #3612: these tests call `decide` directly, not through a disabled button, so they
 * fail when the guard in `decide` goes away.
 */
const context = { page: 'home' as const };
const key = chatKey(context);

const turn = (cards: LabosAgentTurn['cards'] = {}): LabosAgentTurn => ({
  id: 't-1',
  message: 'edit profile',
  status: 'done',
  steps: [],
  content: '',
  sources: [],
  sourceRefs: [],
  followUpQuestions: [],
  proposals: [
    {
      proposalId: 'ap_1',
      tool: 'update_my_profile',
      title: 'Update your bio',
      targetType: 'member',
      changes: [{ field: 'bio', label: 'Bio', oldValue: 'Old', newValue: 'New' }],
    },
  ],
  cards,
  drafts: [],
  draftCards: {},
  startedAt: 0,
});

const seed = (cards?: LabosAgentTurn['cards']) =>
  useLabosAgentStore.setState({ chats: { [key]: { threadId: 'th-1', turns: [turn(cards)] } } });

const cardOf = () => useLabosAgentStore.getState().chats[key].turns[0].cards.ap_1;

describe('LAB-3299: decide guard', () => {
  beforeEach(() => {
    confirmAction.mockReset();
    useLabosAgentStore.setState({ isOpen: true, context, chats: {} });
  });

  it('sends one C2 request when decide runs twice in the same tick', async () => {
    seed();
    let resolve: (v: unknown) => void = () => {};
    confirmAction.mockReturnValue(new Promise((r) => (resolve = r)));
    const { result } = renderHook(() => useLabosAgentChat(context));

    await act(async () => {
      void result.current.decide('t-1', 'ap_1', 'confirm');
      void result.current.decide('t-1', 'ap_1', 'confirm');
    });
    expect(confirmAction).toHaveBeenCalledTimes(1);

    await act(async () => resolve({ proposalId: 'ap_1', status: 'done', summary: 'Your bio is updated.' }));
    expect(cardOf()).toEqual({ status: 'done', summary: 'Your bio is updated.' });
  });

  it.each([
    ['done', { status: 'done' as const, summary: 'Your bio is updated.' }],
    ['cancelled', { status: 'cancelled' as const }],
    ['forbidden', { status: 'forbidden' as const, message: 'No' }],
    ['a final error', { status: 'error' as const, message: 'Expired' }],
  ])('does nothing after %s', async (_name, card) => {
    seed({ ap_1: card });
    const { result } = renderHook(() => useLabosAgentChat(context));

    await act(async () => {
      await result.current.decide('t-1', 'ap_1', 'confirm');
      await result.current.decide('t-1', 'ap_1', 'cancel');
    });
    expect(confirmAction).not.toHaveBeenCalled();
    expect(cardOf()).toEqual(card);
  });

  it('runs again from a retryable error', async () => {
    seed({ ap_1: { status: 'error', message: 'Retry', canRetry: true } });
    confirmAction.mockResolvedValue({ proposalId: 'ap_1', status: 'done', summary: 'Saved.' });
    const { result } = renderHook(() => useLabosAgentChat(context));

    await act(async () => result.current.decide('t-1', 'ap_1', 'confirm'));
    expect(confirmAction).toHaveBeenCalledTimes(1);
    expect(cardOf().status).toBe('done');
  });

  it('shows Cancelled after a failed Cancel', async () => {
    seed();
    confirmAction.mockRejectedValue(new LabosAgentError(0, 'STREAM_FAILED', 'broken'));
    const { result } = renderHook(() => useLabosAgentChat(context));

    await act(async () => result.current.decide('t-1', 'ap_1', 'cancel'));
    expect(confirmAction).toHaveBeenCalledWith({ proposalId: 'ap_1', decision: 'cancel' });
    expect(cardOf()).toEqual({ status: 'cancelled' });
  });

  it('shows the stored status of a 409', async () => {
    seed();
    confirmAction.mockRejectedValue(new LabosAgentError(409, 'PROPOSAL_CLOSED', 'closed', undefined, 'done'));
    const { result } = renderHook(() => useLabosAgentChat(context));

    await act(async () => result.current.decide('t-1', 'ap_1', 'confirm'));
    expect(cardOf()).toEqual({ status: 'done', summary: 'This change is already saved.' });
  });
});
