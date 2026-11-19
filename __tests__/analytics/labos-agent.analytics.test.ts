import { act, renderHook, waitFor } from '@testing-library/react';

import type { LabosAgentClient, LabosAgentMentionChip } from '@/types/labos-agent.types';

/** LAB-3297: the pure helpers of the agent events, `mentionCount` (V0-R3) and the C1 counts (V0-R4). */
const capture = jest.fn();
jest.mock('posthog-js/react', () => ({
  usePostHog: () => ({ capture: (...args: unknown[]) => capture(...args) }),
}));

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

import {
  agentActionType,
  agentErrorType,
  agentFlow,
  agentPageType,
  agentSharedProps,
} from '@/analytics/labos-agent.analytics';
import { useCurrentUserStore } from '@/services/auth/store';
import { useLabosAgentChat } from '@/services/labos-agent/hooks/useLabosAgentChat';
import { openCardsAtClose } from '@/services/labos-agent/hooks/useLabosAgentDockEvents';
import { normalizeChatBody } from '@/services/labos-agent/labos-agent.service';
import { useLabosAgentStore } from '@/services/labos-agent/store';
import type { IUserInfo } from '@/types/shared.types';
import { LABOS_AGENT_ANALYTICS_EVENTS } from '@/utils/constants';

describe('LAB-3297: agent event helpers', () => {
  it('names the 10 v0 events in kebab case with the agent- prefix (V0-R1)', () => {
    expect(Object.values(LABOS_AGENT_ANALYTICS_EVENTS).sort()).toEqual([
      'agent-action-cancelled',
      'agent-action-confirmed',
      'agent-action-failed',
      'agent-action-proposed',
      'agent-answer-failed',
      'agent-answer-shown',
      'agent-dock-closed',
      'agent-dock-opened',
      'agent-message-sent',
      'agent-source-clicked',
    ]);
    // S4 is out of v0.
    expect(Object.values(LABOS_AGENT_ANALYTICS_EVENTS)).not.toContain('agent-draft-copied');
  });

  it('maps each context to a flow and a page type', () => {
    expect(agentFlow({ page: 'news-story', newsUid: 'n' })).toBe('news');
    expect(agentFlow({ page: 'intro', introTarget: { type: 'team', uid: 't' } })).toBe('intro');
    expect(agentFlow({ page: 'profile' })).toBe('profile');
    expect(agentFlow({ page: 'team', teamUid: 't' })).toBe('team');
    expect(agentFlow({ page: 'job' })).toBe('job');
    expect(agentFlow({ page: 'member', memberUid: 'm' })).toBe('other');
    expect(agentFlow({ page: 'home' })).toBe('other');
    expect(agentFlow(null)).toBe('other');

    expect(agentPageType({ page: 'news-story', newsUid: 'n' })).toBe('news');
    expect(agentPageType({ page: 'intro', introTarget: { type: 'team', uid: 't' } })).toBe('team');
    expect(agentPageType({ page: 'member', memberUid: 'm' })).toBe('member');
    expect(agentPageType({ page: 'home' })).toBe('other');
  });

  it('maps each S2 tool to an actionType', () => {
    expect(agentActionType('update_my_profile')).toBe('profile-field');
    expect(agentActionType('add_experience')).toBe('experience');
    expect(agentActionType('update_experience')).toBe('experience');
    expect(agentActionType('update_team')).toBe('team-field');
  });

  it('maps each failure to an errorType', () => {
    expect(agentErrorType({ status: 200, stalled: true })).toBe('timeout');
    expect(agentErrorType({ status: 503 })).toBe('http-5xx');
    expect(agentErrorType({ status: 429 })).toBe('http-4xx');
    expect(agentErrorType({ status: 0 })).toBe('network');
    expect(agentErrorType({ status: 200, code: 'STREAM_FAILED' })).toBe('network');
    expect(agentErrorType({ status: 200, code: 'UNKNOWN' })).toBe('model-error');
  });

  it('shared properties hold no ID or label of the context (V0-R5)', () => {
    const props = agentSharedProps(null, { page: 'news-story', newsUid: 'news-uid-1', label: 'A story title' });
    expect(Object.keys(props).sort()).toEqual(['conversationId', 'entryPoint', 'flow', 'pageType']);
    expect(JSON.stringify(props)).not.toMatch(/news-uid-1|A story title/);
  });

  it('agent-answer-shown (V0-R4): normalizeChatBody keeps valid C1 counts and drops bad ones', () => {
    expect(normalizeChatBody({ toolCount: 2, usedWebSearch: false, sourceCount: 0 })).toMatchObject({
      toolCount: 2,
      usedWebSearch: false,
      sourceCount: 0,
    });
    const bad = normalizeChatBody({ toolCount: -1, usedWebSearch: 'yes', sourceCount: 1.5 });
    expect(bad).not.toHaveProperty('toolCount');
    expect(bad).not.toHaveProperty('usedWebSearch');
    expect(bad).not.toHaveProperty('sourceCount');
  });

  it('agent-action-cancelled: openCardsAtClose lists only the cards that still wait', () => {
    const base = {
      id: 't',
      message: 'm',
      status: 'done' as const,
      steps: [],
      content: '',
      sources: [],
      sourceRefs: [],
      followUpQuestions: [],
      startedAt: 0,
    };
    const proposal = (proposalId: string) => ({
      proposalId,
      tool: 'update_team' as const,
      title: 'T',
      targetType: 'team' as const,
      changes: [],
    });
    const cards = openCardsAtClose(
      [
        {
          ...base,
          proposals: [proposal('open'), proposal('done')],
          cards: { done: { status: 'done' } },
          drafts: [],
          draftCards: {},
        },
      ],
      {},
    );
    expect(cards).toEqual([{ key: 'open', props: { actionType: 'team-field', edited: false } }]);
  });
});

describe('LAB-3297: agent-message-sent mentionCount (V0-R3)', () => {
  const chips: LabosAgentMentionChip[] = [
    { key: 'member:m-secret', label: 'Ada Lovelace', kind: 'member', mention: { type: 'member', uid: 'm-secret' } },
    { key: 'team:t-secret', label: 'Acme', kind: 'team', mention: { type: 'team', uid: 't-secret' } },
  ];

  beforeEach(() => {
    capture.mockReset();
    chat.mockReset();
    chat.mockResolvedValue({
      steps: [],
      content: 'ok',
      sources: [],
      sourceRefs: [],
      followUpQuestions: [],
      actions: [],
      proposals: [],
      drafts: [],
    });
    useLabosAgentStore.setState({ isOpen: false, context: null, chats: {}, session: null, readsPage: true });
    useCurrentUserStore.setState({ currentUser: { uid: 'me' } as IUserInfo, isHydrated: true });
  });

  it('agent-message-sent: a message with 2 chips sends mentionCount=2 and no chip IDs or names', async () => {
    act(() => useLabosAgentStore.getState().actions.openAgent({ context: { page: 'home' }, entryPoint: 'corner' }));
    const { result } = renderHook(() => useLabosAgentChat({ page: 'home' }));
    act(() => {
      result.current.send('Compare @Ada Lovelace and @Acme', chips);
    });
    await waitFor(() => expect(result.current.busy).toBe(false));

    const sent = capture.mock.calls.filter(([event]) => event === 'agent-message-sent');
    expect(sent).toHaveLength(1);
    expect(sent[0][1]).toMatchObject({ mentionCount: 2, turnIndex: 1, flow: 'other', entryPoint: 'corner' });
    expect(JSON.stringify(capture.mock.calls)).not.toMatch(/m-secret|t-secret|Ada Lovelace|Acme/);
  });

  it('agent-message-sent: a message with no chip sends mentionCount=0', async () => {
    act(() => useLabosAgentStore.getState().actions.openAgent({ context: { page: 'home' } }));
    const { result } = renderHook(() => useLabosAgentChat({ page: 'home' }));
    act(() => {
      result.current.send('Hello');
    });
    await waitFor(() => expect(result.current.busy).toBe(false));
    const sent = capture.mock.calls.find(([event]) => event === 'agent-message-sent');
    expect(sent?.[1]).toMatchObject({ mentionCount: 0 });
  });
});
